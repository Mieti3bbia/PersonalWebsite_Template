using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

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
var teachingUploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads", "teachings");
const string publicBaseUrl = "http://localhost:5109";

Directory.CreateDirectory(teachingUploadsPath);

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
            PreviewImage = "http://localhost:5109/uploads/teachings/pezzi-di-vetro-preview.png",
            PdfUrl = "http://localhost:5109/uploads/teachings/pezzi-di-vetro.pdf"
        });

        db.SaveChanges();
    }

    foreach (var teaching in db.Teachings.Where(teaching => teaching.PreviewImage.StartsWith("/assets/teachings/")))
    {
        teaching.PreviewImage = teaching.PreviewImage
            .Replace("/assets/teachings/", "http://localhost:5109/uploads/teachings/");
    }

    foreach (var teaching in db.Teachings.Where(teaching => teaching.PdfUrl.StartsWith("/assets/teachings/")))
    {
        teaching.PdfUrl = teaching.PdfUrl.Replace("/assets/teachings/", "http://localhost:5109/uploads/teachings/");
    }

    foreach (var teaching in db.Teachings.Where(teaching => teaching.PreviewImage.EndsWith(".svg")))
    {
        teaching.PreviewImage = teaching.PreviewImage.Replace(".svg", ".png");
    }

    db.SaveChanges();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("Frontend");

app.MapGet("/api/teachings", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var teachings = await db.Teachings
        .AsNoTracking()
        .OrderBy(teaching => teaching.Title)
        .ToListAsync();

    var teachingCards = teachings
        .Select(teaching => new TeachingCardDto(
            teaching.Title,
            teaching.Author,
            teaching.School,
            ToPublicUrl(teaching.PreviewImage, teachingUploadsPath, "teaching-preview.png"),
            ToPublicUrl(teaching.PdfUrl, teachingUploadsPath, "teaching.pdf")))
        .ToList();

    return teachingCards;
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
    var previewImage = await SaveUploadedFile(form.Files["previewImageFile"], teachingUploadsPath, "image");
    var pdfUrl = await SaveUploadedFile(form.Files["pdfFile"], teachingUploadsPath, "pdf");

    var teaching = new Teaching
    {
        Title = ReadRequiredFormValue(form, "title"),
        Author = ReadRequiredFormValue(form, "author"),
        School = ReadRequiredFormValue(form, "school"),
        PreviewImage = previewImage ?? ReadRequiredFormValue(form, "previewImage"),
        PdfUrl = pdfUrl ?? ReadRequiredFormValue(form, "pdfUrl")
    };

    db.Teachings.Add(teaching);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
});

app.MapPost("/api/teachings/upload", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest(new { error = "Expected multipart/form-data." });
    }

    var form = await request.ReadFormAsync();
    var title = ReadRequiredFormValue(form, "title");
    var author = ReadRequiredFormValue(form, "author");
    var school = ReadRequiredFormValue(form, "school");
    var previewImage = await SaveUploadedFile(form.Files["previewImage"], teachingUploadsPath, "image");
    var pdfUrl = await SaveUploadedFile(form.Files["pdf"], teachingUploadsPath, "pdf");

    if (string.IsNullOrWhiteSpace(title) ||
        string.IsNullOrWhiteSpace(author) ||
        string.IsNullOrWhiteSpace(school))
    {
        return Results.BadRequest(new { error = "title, author, and school are required." });
    }

    var teaching = new Teaching
    {
        Title = title,
        Author = author,
        School = school,
        PreviewImage = previewImage ?? string.Empty,
        PdfUrl = pdfUrl ?? string.Empty
    };

    db.Teachings.Add(teaching);
    await db.SaveChangesAsync();

    return Results.Created($"/api/teachings/{teaching.Id}", new TeachingCardDto(
        teaching.Title,
        teaching.Author,
        teaching.School,
        ToPublicUrl(teaching.PreviewImage, teachingUploadsPath, "teaching-preview.png"),
        ToPublicUrl(teaching.PdfUrl, teachingUploadsPath, "teaching.pdf")));
})
.DisableAntiforgery();

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

static async Task<string?> SaveUploadedFile(IFormFile? file, string uploadsPath, string kind)
{
    if (file is null || file.Length == 0)
    {
        return null;
    }

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowedExtensions = kind == "pdf"
        ? [".pdf"]
        : new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg" };

    if (!allowedExtensions.Contains(extension))
    {
        throw new InvalidOperationException($"Invalid {kind} file type.");
    }

    var nameWithoutExtension = Path.GetFileNameWithoutExtension(file.FileName);
    var safeName = Regex.Replace(nameWithoutExtension.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
    var fileName = $"{(string.IsNullOrWhiteSpace(safeName) ? "teaching" : safeName)}{extension}";
    var destination = Path.Combine(uploadsPath, fileName);

    if (File.Exists(destination))
    {
        fileName = $"{Path.GetFileNameWithoutExtension(fileName)}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{extension}";
        destination = Path.Combine(uploadsPath, fileName);
    }

    await using var stream = File.Create(destination);
    await file.CopyToAsync(stream);

    return $"/uploads/teachings/{fileName}";
}

string ToPublicUrl(string value, string uploadsPath, string fallbackFileName)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return $"{publicBaseUrl}/uploads/teachings/{fallbackFileName}";
    }

    if (value.StartsWith("http://localhost:5109/uploads/teachings/", StringComparison.OrdinalIgnoreCase))
    {
        var fileName = Path.GetFileName(new Uri(value).LocalPath);
        return File.Exists(Path.Combine(uploadsPath, fileName))
            ? value
            : $"{publicBaseUrl}/uploads/teachings/{fallbackFileName}";
    }

    if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
        value.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        return value;
    }

    var path = value.StartsWith('/') ? value : $"/uploads/teachings/{value}";
    var localFileName = Path.GetFileName(path);

    if (path.StartsWith("/uploads/teachings/", StringComparison.OrdinalIgnoreCase) &&
        !File.Exists(Path.Combine(uploadsPath, localFileName)))
    {
        return $"{publicBaseUrl}/uploads/teachings/{fallbackFileName}";
    }

    return $"{publicBaseUrl}{path}";
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

                .file-picker {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) auto;
                    gap: 8px;
                    align-items: center;
                }

                .file-picker input[type="file"] {
                    position: absolute;
                    inline-size: 1px;
                    block-size: 1px;
                    opacity: 0;
                    pointer-events: none;
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

                button.secondary {
                    background: #394b59;
                    white-space: nowrap;
                }

                button.secondary:hover {
                    background: #2c3a45;
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
                    <form class="add" method="post" action="/dashboard/teachings" enctype="multipart/form-data">
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
                            <span class="file-picker">
                                <input id="previewImage" name="previewImage" maxlength="500" value="/uploads/teachings/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="previewImageFile">Browse</button>
                                <input id="previewImageFile" name="previewImageFile" type="file" accept="image/*" data-target="previewImage">
                            </span>
                        </label>
                        <label class="wide">
                            PDF URL
                            <span class="file-picker">
                                <input id="pdfUrl" name="pdfUrl" maxlength="500" value="/uploads/teachings/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="pdfUrlFile">Browse</button>
                                <input id="pdfUrlFile" name="pdfFile" type="file" accept="application/pdf,.pdf" data-target="pdfUrl">
                            </span>
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
            <script>
                document.querySelectorAll("[data-file-button]").forEach((button) => {
                    button.addEventListener("click", () => {
                        document.getElementById(button.dataset.fileButton).click();
                    });
                });

                document.querySelectorAll("input[type='file'][data-target]").forEach((fileInput) => {
                    fileInput.addEventListener("change", () => {
                        const file = fileInput.files && fileInput.files[0];

                        if (!file) {
                            return;
                        }

                        document.getElementById(fileInput.dataset.target).value = `/uploads/teachings/${file.name}`;
                    });
                });
            </script>
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
