using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDbContext<PersonalWebsiteDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("PersonalWebsite")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PersonalWebsiteDbContext>();
    db.Database.EnsureCreated();

    if (!db.Teachings.Any())
    {
        db.Teachings.Add(new Teaching
        {
            Title = "Pezzi di vetro",
            Author = "Nicoletta Atzeni",
            School = "IED Milano",
            PreviewImage = "/assets/teachings/pezzi-di-vetro-preview.png",
            PdfUrl = "/assets/teachings/pezzi-di-vetro.pdf"
        });

        db.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");

app.MapGet("/api/teachings", async (PersonalWebsiteDbContext db) =>
{
    var teachings = await db.Teachings
        .AsNoTracking()
        .OrderBy(teaching => teaching.Title)
        .Select(teaching => new TeachingCardDto(
            teaching.Title,
            teaching.Author,
            teaching.School,
            teaching.PreviewImage,
            teaching.PdfUrl))
        .ToListAsync();

    return Results.Ok(teachings);
})
.WithName("GetTeachings");

app.MapGet("/dashboard", async (PersonalWebsiteDbContext db) =>
{
    var teachings = await db.Teachings
        .AsNoTracking()
        .OrderBy(teaching => teaching.Title)
        .ToListAsync();

    return Results.Content(RenderDashboard(teachings), "text/html; charset=utf-8");
});

app.MapPost("/dashboard/teachings", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var form = await request.ReadFormAsync();
    var teaching = new Teaching
    {
        Title = ReadRequiredFormValue(form, "title"),
        Author = ReadRequiredFormValue(form, "author"),
        School = ReadRequiredFormValue(form, "school"),
        PreviewImage = ReadRequiredFormValue(form, "previewImage"),
        PdfUrl = ReadRequiredFormValue(form, "pdfUrl")
    };

    db.Teachings.Add(teaching);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
});

app.MapPost("/dashboard/teachings/{id:int}/delete", async (int id, PersonalWebsiteDbContext db) =>
{
    var teaching = await db.Teachings.FindAsync(id);

    if (teaching is not null)
    {
        db.Teachings.Remove(teaching);
        await db.SaveChangesAsync();
    }

    return Results.Redirect("/dashboard");
});

app.Run();

static string ReadRequiredFormValue(IFormCollection form, string key)
{
    return form[key].ToString().Trim();
}

static string RenderDashboard(IReadOnlyCollection<Teaching> teachings)
{
    var rows = new StringBuilder();

    foreach (var teaching in teachings)
    {
        rows.Append($"""
            <tr>
                <td>{Html(teaching.Title)}</td>
                <td>{Html(teaching.Author)}</td>
                <td>{Html(teaching.School)}</td>
                <td><code>{Html(teaching.PreviewImage)}</code></td>
                <td><code>{Html(teaching.PdfUrl)}</code></td>
                <td>
                    <form method="post" action="/dashboard/teachings/{teaching.Id}/delete">
                        <button class="danger" type="submit">Delete</button>
                    </form>
                </td>
            </tr>
            """);
    }

    var emptyState = teachings.Count == 0
        ? """<tr><td colspan="6" class="empty">No teachings in the database yet.</td></tr>"""
        : string.Empty;

    return $$"""
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Database Dashboard</title>
            <style>
                :root {
                    color-scheme: light;
                    --bg: #f6f7f9;
                    --panel: #ffffff;
                    --text: #17202a;
                    --muted: #607080;
                    --line: #d9dee5;
                    --accent: #176b87;
                    --accent-hover: #12546b;
                    --danger: #b42318;
                    --danger-hover: #8f1c14;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    font-family: Arial, Helvetica, sans-serif;
                    background: var(--bg);
                    color: var(--text);
                }

                main {
                    width: min(1180px, calc(100% - 32px));
                    margin: 32px auto;
                }

                header {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    align-items: end;
                    margin-bottom: 24px;
                }

                h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }

                .count {
                    color: var(--muted);
                    font-size: 14px;
                }

                section {
                    background: var(--panel);
                    border: 1px solid var(--line);
                    border-radius: 8px;
                    margin-bottom: 24px;
                    overflow: hidden;
                }

                .section-title {
                    padding: 18px 20px;
                    border-bottom: 1px solid var(--line);
                    font-size: 18px;
                    font-weight: 700;
                }

                form.add {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 16px;
                    padding: 20px;
                }

                label {
                    display: grid;
                    gap: 6px;
                    color: var(--muted);
                    font-size: 13px;
                    font-weight: 700;
                }

                input {
                    width: 100%;
                    border: 1px solid var(--line);
                    border-radius: 6px;
                    padding: 10px 12px;
                    font: inherit;
                    color: var(--text);
                    background: #fff;
                }

                .wide {
                    grid-column: 1 / -1;
                }

                button {
                    border: 0;
                    border-radius: 6px;
                    padding: 10px 14px;
                    font: inherit;
                    font-weight: 700;
                    cursor: pointer;
                    color: white;
                    background: var(--accent);
                }

                button:hover {
                    background: var(--accent-hover);
                }

                button.danger {
                    background: var(--danger);
                    padding: 7px 10px;
                    font-size: 13px;
                }

                button.danger:hover {
                    background: var(--danger-hover);
                }

                .table-wrap {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                th,
                td {
                    padding: 12px 14px;
                    border-bottom: 1px solid var(--line);
                    text-align: left;
                    vertical-align: top;
                }

                th {
                    color: var(--muted);
                    font-size: 12px;
                    text-transform: uppercase;
                }

                code {
                    font-family: Consolas, monospace;
                    font-size: 12px;
                    white-space: nowrap;
                }

                .empty {
                    color: var(--muted);
                    text-align: center;
                    padding: 28px;
                }

                @media (max-width: 760px) {
                    header {
                        display: block;
                    }

                    form.add {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <main>
                <header>
                    <h1>Database Dashboard</h1>
                    <div class="count">{{teachings.Count}} teaching{{(teachings.Count == 1 ? string.Empty : "s")}}</div>
                </header>

                <section>
                    <div class="section-title">Add teaching</div>
                    <form class="add" method="post" action="/dashboard/teachings">
                        <label>
                            Title
                            <input name="title" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Author
                            <input name="author" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            School
                            <input name="school" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Preview image
                            <input name="previewImage" required maxlength="500" value="/assets/teachings/" autocomplete="off">
                        </label>
                        <label class="wide">
                            PDF URL
                            <input name="pdfUrl" required maxlength="500" value="/assets/teachings/" autocomplete="off">
                        </label>
                        <div class="wide">
                            <button type="submit">Add to database</button>
                        </div>
                    </form>
                </section>

                <section>
                    <div class="section-title">Teachings</div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>School</th>
                                    <th>Preview image</th>
                                    <th>PDF URL</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {{rows}}
                                {{emptyState}}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </body>
        </html>
        """;
}

static string Html(string value)
{
    return WebUtility.HtmlEncode(value);
}

sealed class PersonalWebsiteDbContext(DbContextOptions<PersonalWebsiteDbContext> options) : DbContext(options)
{
    public DbSet<Teaching> Teachings => Set<Teaching>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Teaching>(entity =>
        {
            entity.ToTable("teachings");
            entity.HasKey(teaching => teaching.Id);

            entity.Property(teaching => teaching.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(teaching => teaching.Author)
                .HasColumnName("author")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(teaching => teaching.School)
                .HasColumnName("school")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(teaching => teaching.PreviewImage)
                .HasColumnName("preview_image")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(teaching => teaching.PdfUrl)
                .HasColumnName("pdf_url")
                .HasMaxLength(500)
                .IsRequired();
        });
    }
}

sealed class Teaching
{
    public int Id { get; set; }

    public required string Title { get; set; }

    public required string Author { get; set; }

    public required string School { get; set; }

    public required string PreviewImage { get; set; }

    public required string PdfUrl { get; set; }
}

sealed record TeachingCardDto(
    string Title,
    string Author,
    string School,
    string PreviewImage,
    string PdfUrl);
