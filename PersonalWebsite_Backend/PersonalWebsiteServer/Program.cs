using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;

const long MaxUploadSize = 1024L * 1024L * 1024L;
const string DefaultDashboardUsername = "admin";
const string DefaultDashboardPassword = "terapiatapioca";
const string ApiRateLimitPolicy = "api-five-seconds";
const string DefaultContactDestinationEmail = "mariasole.freelancer@libero.it";
const string DefaultSmtpHost = "smtp.libero.it";
const string DefaultSmtpPort = "465";
const string DefaultSmtpUser = "mariasole.freelancer@libero.it";
const string DefaultSmtpFromEmail = "mariasole.freelancer@libero.it";
const string DefaultPublicBaseUrl = "http://localhost:5109";
const string DefaultCorsAllowedOrigins = "http://localhost:4200,https://localhost:4200";

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxUploadSize;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxUploadSize;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(ApiRateLimitPolicy, context =>
    {
        var clientKey = GetClientKey(context);
        var endpointKey = context.Request.Path.Value ?? string.Empty;

        return RateLimitPartition.GetFixedWindowLimiter(
            $"{clientKey}:{endpointKey}",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 1,
                Window = TimeSpan.FromSeconds(5),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });
builder.Services.AddAuthorization();
builder.Services.AddDbContext<PersonalWebsiteDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("PersonalWebsite")));

var dashboardUsername = GetSetting("DASHBOARD_USERNAME", DefaultDashboardUsername);
var dashboardPassword = GetSetting("DASHBOARD_PASSWORD", DefaultDashboardPassword);
var contactDestinationEmail = GetSetting("CONTACT_DESTINATION_EMAIL", DefaultContactDestinationEmail);
var publicBaseUrl = GetSetting("PUBLIC_BASE_URL", DefaultPublicBaseUrl).TrimEnd('/');
var corsAllowedOrigins = SplitSettingList(GetSetting("CORS_ALLOWED_ORIGINS", DefaultCorsAllowedOrigins));

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(corsAllowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();
var teachingUploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads", "teachings");
var fashionDesignUploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads", "fashion-designs");
var costumeDesignUploadsPath = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "uploads", "costume-designs");

Directory.CreateDirectory(teachingUploadsPath);
Directory.CreateDirectory(fashionDesignUploadsPath);
Directory.CreateDirectory(costumeDesignUploadsPath);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PersonalWebsiteDbContext>();
    db.Database.EnsureCreated();
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS fashion_designs (
            id INTEGER NOT NULL CONSTRAINT PK_fashion_designs PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            explaining_video TEXT NOT NULL,
            description TEXT NOT NULL,
            gallery TEXT NOT NULL,
            pdf_url TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0
        );
        """);
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS costume_designs (
            id INTEGER NOT NULL CONSTRAINT PK_costume_designs PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            season TEXT NOT NULL,
            role TEXT NOT NULL,
            video TEXT NOT NULL DEFAULT '',
            gallery TEXT NOT NULL,
            description TEXT NOT NULL,
            credits TEXT NOT NULL,
            visible INTEGER NOT NULL DEFAULT 1,
            display_order INTEGER NOT NULL DEFAULT 0
        );
        """);
    EnsureDisplayOrderColumn(db, "teachings");
    EnsureDisplayOrderColumn(db, "fashion_designs");
    EnsureDisplayOrderColumn(db, "costume_designs");
    InitializeDisplayOrder(db, "teachings");
    InitializeDisplayOrder(db, "fashion_designs");
    InitializeDisplayOrder(db, "costume_designs");

    if (!db.Teachings.Any())
    {
        db.Teachings.Add(new Teaching
        {
            Title = "Pezzi di vetro",
            Author = "Nicoletta Atzeni",
            School = "IED Milano",
            PreviewImage = $"{publicBaseUrl}/uploads/teachings/pezzi-di-vetro-preview.png",
            PdfUrl = $"{publicBaseUrl}/uploads/teachings/pezzi-di-vetro.pdf",
            DisplayOrder = 1
        });

        db.SaveChanges();
    }

    foreach (var teaching in db.Teachings.Where(teaching => teaching.PreviewImage.StartsWith("/assets/teachings/")))
    {
        teaching.PreviewImage = teaching.PreviewImage
            .Replace("/assets/teachings/", $"{publicBaseUrl}/uploads/teachings/");
    }

    foreach (var teaching in db.Teachings.Where(teaching => teaching.PdfUrl.StartsWith("/assets/teachings/")))
    {
        teaching.PdfUrl = teaching.PdfUrl.Replace("/assets/teachings/", $"{publicBaseUrl}/uploads/teachings/");
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
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/dashboard"))
    .RequireAuthorization();

app.MapGet("/login", (HttpContext context) =>
{
    return context.User.Identity?.IsAuthenticated == true
        ? Results.Redirect("/dashboard")
        : Results.Content(RenderLogin(), "text/html; charset=utf-8");
});

app.MapPost("/login", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var username = ReadRequiredFormValue(form, "username");
    var password = ReadRequiredFormValue(form, "password");

    if (username != dashboardUsername || password != dashboardPassword)
    {
        return Results.Content(
            RenderLogin("Invalid username or password."),
            "text/html; charset=utf-8",
            statusCode: StatusCodes.Status401Unauthorized);
    }

    var claims = new[] { new Claim(ClaimTypes.Name, dashboardUsername) };
    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(identity));

    var returnUrl = context.Request.Query["ReturnUrl"].ToString();
    return Results.Redirect(string.IsNullOrWhiteSpace(returnUrl) ? "/dashboard" : returnUrl);
});

app.MapPost("/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Redirect("/login");
});

app.MapGet("/api/teachings", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var teachings = await db.Teachings
        .AsNoTracking()
        .OrderBy(teaching => teaching.DisplayOrder)
        .ThenBy(teaching => teaching.Id)
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
.RequireRateLimiting(ApiRateLimitPolicy)
.WithName("GetTeachings");

app.MapGet("/api/fashion-designs", async (PersonalWebsiteDbContext db) =>
{
    var entries = await db.FashionDesigns
        .AsNoTracking()
        .OrderBy(entry => entry.DisplayOrder)
        .ThenBy(entry => entry.Id)
        .ToListAsync();

    return entries
        .Select(entry => new FashionDesignDto(
            entry.Title,
            ToPublicUrl(entry.ExplainingVideo, fashionDesignUploadsPath, "fashion-video.mp4", "fashion-designs"),
            entry.Description,
            SplitGallery(entry.Gallery)
                .Select(path => ToPublicUrl(path, fashionDesignUploadsPath, "fashion-gallery.png", "fashion-designs"))
                .ToArray(),
            ToPublicUrl(entry.PdfUrl, fashionDesignUploadsPath, "fashion-design.pdf", "fashion-designs")))
        .ToList();
})
.RequireRateLimiting(ApiRateLimitPolicy)
.WithName("GetFashionDesigns");

app.MapGet("/api/costume-designs", async (PersonalWebsiteDbContext db) =>
{
    var entries = await db.CostumeDesigns
        .AsNoTracking()
        .Where(entry => entry.Visible)
        .OrderBy(entry => entry.DisplayOrder)
        .ThenBy(entry => entry.Id)
        .ToListAsync();

    return entries
        .Select(entry => new CostumeDesignDto(
            entry.Title,
            entry.Season,
            entry.Role,
            string.IsNullOrWhiteSpace(entry.Video)
                ? string.Empty
                : ToPublicUrl(entry.Video, costumeDesignUploadsPath, "costume-video.mp4", "costume-designs"),
            SplitGallery(entry.Gallery)
                .Select(path => ToPublicUrl(path, costumeDesignUploadsPath, "costume-gallery.png", "costume-designs"))
                .ToArray(),
            entry.Description,
            entry.Credits))
        .ToList();
})
.RequireRateLimiting(ApiRateLimitPolicy)
.WithName("GetCostumeDesigns");

app.MapPost("/api/contact", async (HttpContext context, ContactRequest? request) =>
{
    Console.WriteLine("Contact form has entered the inbox runway. Tiny SMTP hat: on.");
    Console.WriteLine(JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = true }));

    var validationErrors = ValidateContactRequest(request, contactDestinationEmail);

    if (validationErrors.Count > 0)
    {
        return Results.Json(
            new { ok = false, error = string.Join(" ", validationErrors) },
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (LooksLikeSpam(request!.Form))
    {
        return Results.Json(
            new { ok = false, error = "Invalid contact request." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    try
    {
        await SendContactEmail(request, contactDestinationEmail);
        Console.WriteLine($"Contact email sent to {contactDestinationEmail}.");
        return Results.Json(new { ok = true }, statusCode: StatusCodes.Status200OK);
    }
    catch (InvalidOperationException exception)
    {
        Console.WriteLine($"Contact email configuration error: {exception.Message}");
        return Results.Json(
            new { ok = false, error = exception.Message },
            statusCode: StatusCodes.Status500InternalServerError);
    }
    catch (SmtpCommandException exception)
    {
        Console.WriteLine($"SMTP provider rejected contact email: {exception.Message}");
        return Results.Json(
            new { ok = false, error = $"SMTP provider rejected contact email: {exception.Message}" },
            statusCode: StatusCodes.Status500InternalServerError);
    }
    catch (SmtpProtocolException exception)
    {
        Console.WriteLine($"SMTP protocol error: {exception.Message}");
        return Results.Json(
            new { ok = false, error = $"SMTP protocol error: {exception.Message}" },
            statusCode: StatusCodes.Status500InternalServerError);
    }
    catch (Exception exception)
    {
        Console.WriteLine($"Unexpected contact email error: {exception.Message}");
        return Results.Json(
            new { ok = false, error = "Unexpected contact email error." },
            statusCode: StatusCodes.Status500InternalServerError);
    }
})
.DisableAntiforgery()
.WithName("PostContact");

app.MapGet("/dashboard", async (PersonalWebsiteDbContext db) =>
{
    var teachings = await db.Teachings
        .AsNoTracking()
        .OrderBy(teaching => teaching.DisplayOrder)
        .ThenBy(teaching => teaching.Id)
        .ToListAsync();
    var fashionDesigns = await db.FashionDesigns
        .AsNoTracking()
        .OrderBy(entry => entry.DisplayOrder)
        .ThenBy(entry => entry.Id)
        .ToListAsync();
    var costumeDesigns = await db.CostumeDesigns
        .AsNoTracking()
        .OrderBy(entry => entry.DisplayOrder)
        .ThenBy(entry => entry.Id)
        .ToListAsync();

    return Results.Content(RenderDashboard(teachings, fashionDesigns, costumeDesigns), "text/html; charset=utf-8");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/teachings", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var form = await request.ReadFormAsync();
    var previewImage = await SaveUploadedFile(form.Files["previewImageFile"], teachingUploadsPath, "teachings", "image");
    var pdfUrl = await SaveUploadedFile(form.Files["pdfFile"], teachingUploadsPath, "teachings", "pdf");

    var teaching = new Teaching
    {
        Title = ReadRequiredFormValue(form, "title"),
        Author = ReadRequiredFormValue(form, "author"),
        School = ReadRequiredFormValue(form, "school"),
        PreviewImage = previewImage ?? ReadRequiredFormValue(form, "previewImage"),
        PdfUrl = pdfUrl ?? ReadRequiredFormValue(form, "pdfUrl"),
        DisplayOrder = await GetNextDisplayOrder(db.Teachings)
    };

    db.Teachings.Add(teaching);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/fashion-designs", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var form = await request.ReadFormAsync();
    var explainingVideo = await SaveUploadedFile(form.Files["explainingVideoFile"], fashionDesignUploadsPath, "fashion-designs", "video");
    var gallery = await SaveUploadedFiles(form.Files.GetFiles("galleryFiles"), fashionDesignUploadsPath, "fashion-designs", "image");
    var pdfUrl = await SaveUploadedFile(form.Files["fashionPdfFile"], fashionDesignUploadsPath, "fashion-designs", "pdf");

    var entry = new FashionDesign
    {
        Title = ReadRequiredFormValue(form, "title"),
        ExplainingVideo = explainingVideo ?? ReadRequiredFormValue(form, "explainingVideo"),
        Description = ReadRequiredFormValue(form, "description"),
        Gallery = gallery.Count > 0 ? string.Join('|', gallery) : ReadRequiredFormValue(form, "gallery"),
        PdfUrl = pdfUrl ?? ReadRequiredFormValue(form, "pdfUrl"),
        DisplayOrder = await GetNextDisplayOrder(db.FashionDesigns)
    };

    db.FashionDesigns.Add(entry);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/costume-designs", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    var form = await request.ReadFormAsync();
    var video = await SaveUploadedFile(form.Files["costumeVideoFile"], costumeDesignUploadsPath, "costume-designs", "video");
    var gallery = await SaveUploadedFiles(form.Files.GetFiles("costumeGalleryFiles"), costumeDesignUploadsPath, "costume-designs", "image");

    var entry = new CostumeDesign
    {
        Title = ReadRequiredFormValue(form, "title"),
        Season = ReadRequiredFormValue(form, "season"),
        Role = ReadRequiredFormValue(form, "role"),
        Video = video ?? ReadRequiredFormValue(form, "video"),
        Gallery = gallery.Count > 0 ? string.Join('|', gallery) : ReadRequiredFormValue(form, "gallery"),
        Description = ReadRequiredFormValue(form, "description"),
        Credits = ReadRequiredFormValue(form, "credits"),
        Visible = form.ContainsKey("visible"),
        DisplayOrder = await GetNextDisplayOrder(db.CostumeDesigns)
    };

    db.CostumeDesigns.Add(entry);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

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
    var previewImage = await SaveUploadedFile(form.Files["previewImage"], teachingUploadsPath, "teachings", "image");
    var pdfUrl = await SaveUploadedFile(form.Files["pdf"], teachingUploadsPath, "teachings", "pdf");

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
        PdfUrl = pdfUrl ?? string.Empty,
        DisplayOrder = await GetNextDisplayOrder(db.Teachings)
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
.RequireRateLimiting(ApiRateLimitPolicy)
.DisableAntiforgery();

app.MapPost("/api/fashion-designs/upload", async (HttpRequest request, PersonalWebsiteDbContext db) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest(new { error = "Expected multipart/form-data." });
    }

    var form = await request.ReadFormAsync();
    var title = ReadRequiredFormValue(form, "title");
    var description = ReadRequiredFormValue(form, "description");
    var explainingVideo = await SaveUploadedFile(form.Files["explainingVideo"], fashionDesignUploadsPath, "fashion-designs", "video");
    var gallery = await SaveUploadedFiles(form.Files.GetFiles("gallery"), fashionDesignUploadsPath, "fashion-designs", "image");
    var pdfUrl = await SaveUploadedFile(form.Files["pdf"], fashionDesignUploadsPath, "fashion-designs", "pdf");

    if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
    {
        return Results.BadRequest(new { error = "title and description are required." });
    }

    var entry = new FashionDesign
    {
        Title = title,
        ExplainingVideo = explainingVideo ?? string.Empty,
        Description = description,
        Gallery = string.Join('|', gallery),
        PdfUrl = pdfUrl ?? string.Empty,
        DisplayOrder = await GetNextDisplayOrder(db.FashionDesigns)
    };

    db.FashionDesigns.Add(entry);
    await db.SaveChangesAsync();

    return Results.Created($"/api/fashion-designs/{entry.Id}", new FashionDesignDto(
        entry.Title,
        ToPublicUrl(entry.ExplainingVideo, fashionDesignUploadsPath, "fashion-video.mp4", "fashion-designs"),
        entry.Description,
        SplitGallery(entry.Gallery)
            .Select(path => ToPublicUrl(path, fashionDesignUploadsPath, "fashion-gallery.png", "fashion-designs"))
            .ToArray(),
        ToPublicUrl(entry.PdfUrl, fashionDesignUploadsPath, "fashion-design.pdf", "fashion-designs")));
})
.RequireRateLimiting(ApiRateLimitPolicy)
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
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/teachings/{id:int}/move-up", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.Teachings, id, MoveDirection.Up);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/teachings/{id:int}/move-down", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.Teachings, id, MoveDirection.Down);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/fashion-designs/{id:int}/delete", async (int id, PersonalWebsiteDbContext db) =>
{
    var entry = await db.FashionDesigns.FindAsync(id);

    if (entry is not null)
    {
        db.FashionDesigns.Remove(entry);
        await db.SaveChangesAsync();
    }

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/fashion-designs/{id:int}/move-up", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.FashionDesigns, id, MoveDirection.Up);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/fashion-designs/{id:int}/move-down", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.FashionDesigns, id, MoveDirection.Down);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/costume-designs/{id:int}/delete", async (int id, PersonalWebsiteDbContext db) =>
{
    var entry = await db.CostumeDesigns.FindAsync(id);

    if (entry is not null)
    {
        db.CostumeDesigns.Remove(entry);
        await db.SaveChangesAsync();
    }

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/costume-designs/{id:int}/move-up", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.CostumeDesigns, id, MoveDirection.Up);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.MapPost("/dashboard/costume-designs/{id:int}/move-down", async (int id, PersonalWebsiteDbContext db) =>
{
    await MoveEntry(db.CostumeDesigns, id, MoveDirection.Down);
    await db.SaveChangesAsync();

    return Results.Redirect("/dashboard");
})
.RequireRateLimiting(ApiRateLimitPolicy)
.RequireAuthorization();

app.Run();

static void EnsureDisplayOrderColumn(PersonalWebsiteDbContext db, string tableName)
{
    if (!IsKnownDashboardTable(tableName) || ColumnExists(db, tableName, "display_order"))
    {
        return;
    }

    db.Database.ExecuteSqlRaw($"ALTER TABLE {tableName} ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;");
}

static bool ColumnExists(PersonalWebsiteDbContext db, string tableName, string columnName)
{
    using var command = db.Database.GetDbConnection().CreateCommand();
    command.CommandText = $"PRAGMA table_info({tableName});";

    if (command.Connection?.State != System.Data.ConnectionState.Open)
    {
        command.Connection?.Open();
    }

    using var reader = command.ExecuteReader();

    while (reader.Read())
    {
        if (string.Equals(reader["name"]?.ToString(), columnName, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }
    }

    return false;
}

static void InitializeDisplayOrder(PersonalWebsiteDbContext db, string tableName)
{
    if (!IsKnownDashboardTable(tableName))
    {
        return;
    }

    db.Database.ExecuteSqlRaw($"UPDATE {tableName} SET display_order = id WHERE display_order = 0;");
}

static bool IsKnownDashboardTable(string tableName)
{
    return tableName is "teachings" or "fashion_designs" or "costume_designs";
}

static async Task<int> GetNextDisplayOrder<TEntry>(DbSet<TEntry> entries)
    where TEntry : class, IOrderedDashboardEntry
{
    var maxOrder = await entries.MaxAsync(entry => (int?)entry.DisplayOrder);

    return (maxOrder ?? 0) + 1;
}

static async Task MoveEntry<TEntry>(DbSet<TEntry> entries, int id, MoveDirection direction)
    where TEntry : class, IOrderedDashboardEntry
{
    var orderedEntries = await entries
        .OrderBy(entry => entry.DisplayOrder)
        .ThenBy(entry => entry.Id)
        .ToListAsync();
    var currentIndex = orderedEntries.FindIndex(entry => entry.Id == id);

    if (currentIndex < 0)
    {
        return;
    }

    for (var index = 0; index < orderedEntries.Count; index++)
    {
        orderedEntries[index].DisplayOrder = index + 1;
    }

    var targetIndex = direction == MoveDirection.Up
        ? currentIndex - 1
        : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= orderedEntries.Count)
    {
        return;
    }

    (orderedEntries[currentIndex].DisplayOrder, orderedEntries[targetIndex].DisplayOrder) =
        (orderedEntries[targetIndex].DisplayOrder, orderedEntries[currentIndex].DisplayOrder);
}

static string ReadRequiredFormValue(IFormCollection form, string key)
{
    return form[key].ToString().Trim();
}

static IReadOnlyList<string> ValidateContactRequest(ContactRequest? request, string? recipientEmail)
{
    var errors = new List<string>();

    if (request is null)
    {
        return ["Request body is required."];
    }

    AddRequiredError(errors, recipientEmail, "CONTACT_DESTINATION_EMAIL");
    AddRequiredError(errors, request.Form?.FirstName, "form.firstName");
    AddRequiredError(errors, request.Form?.LastName, "form.lastName");
    AddRequiredError(errors, request.Form?.Email, "form.email");
    AddRequiredError(errors, request.Form?.Type, "form.type");
    AddRequiredError(errors, request.Form?.Subject, "form.subject");
    AddRequiredError(errors, request.Form?.Message, "form.message");

    if (!string.IsNullOrWhiteSpace(recipientEmail) && !IsEmailAddress(recipientEmail))
    {
        errors.Add("CONTACT_DESTINATION_EMAIL must be a valid email address.");
    }

    if (!string.IsNullOrWhiteSpace(request.Form?.Email) && !IsEmailAddress(request.Form.Email))
    {
        errors.Add("form.email must be a valid email address.");
    }

    if (!string.IsNullOrWhiteSpace(request.Email?.ReplyTo) && !IsEmailAddress(request.Email.ReplyTo))
    {
        errors.Add("email.replyTo must be a valid email address.");
    }

    return errors;
}

static void AddRequiredError(List<string> errors, string? value, string field)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        errors.Add($"{field} is required.");
    }
}

static bool IsEmailAddress(string value)
{
    return MailboxAddress.TryParse(value, out _);
}

static bool LooksLikeSpam(ContactForm form)
{
    var combinedText = $"{form.FirstName} {form.LastName} {form.Type} {form.Subject} {form.Message}";
    var urlCount = Regex.Matches(combinedText, @"https?://|www\.", RegexOptions.IgnoreCase).Count;

    return urlCount > 3 ||
        form.Message.Length > 5000 ||
        form.Subject.Length > 200;
}

static string GetClientKey(HttpContext context)
{
    return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

static string GetSetting(string name, string fallback)
{
    var value = Environment.GetEnvironmentVariable(name);
    return string.IsNullOrWhiteSpace(value) ? fallback : value;
}

static string[] SplitSettingList(string value)
{
    return value
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Where(item => !string.IsNullOrWhiteSpace(item))
        .ToArray();
}

static async Task SendContactEmail(ContactRequest request, string recipientEmail)
{
    var host = GetSetting("SMTP_HOST", DefaultSmtpHost);
    var portValue = GetSetting("SMTP_PORT", DefaultSmtpPort);
    var username = GetSetting("SMTP_USER", DefaultSmtpUser);
    var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
    var fromEmail = GetSetting("SMTP_FROM_EMAIL", DefaultSmtpFromEmail);

    Console.WriteLine($"SMTP config: host={host ?? "<missing>"}, port={portValue ?? "<missing>"}, user={username ?? "<missing>"}, from={fromEmail ?? "<missing>"}, passwordSet={!string.IsNullOrWhiteSpace(password)}");

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(portValue) ||
        string.IsNullOrWhiteSpace(username) ||
        string.IsNullOrWhiteSpace(password) ||
        string.IsNullOrWhiteSpace(fromEmail) ||
        !int.TryParse(portValue, out var port))
    {
        throw new InvalidOperationException("SMTP configuration is incomplete.");
    }

    var message = new MimeMessage();
    message.From.Add(MailboxAddress.Parse(fromEmail));
    message.To.Add(MailboxAddress.Parse(recipientEmail));
    message.ReplyTo.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(request.Email?.ReplyTo)
        ? request.Form.Email
        : request.Email.ReplyTo));
    message.Subject = string.IsNullOrWhiteSpace(request.Email?.Subject)
        ? $"{request.Form.Type} - {request.Form.Subject}"
        : request.Email.Subject;
    message.Body = new TextPart("plain")
    {
        Text = string.IsNullOrWhiteSpace(request.Email?.Text)
            ? BuildContactEmailBody(request.Form)
            : request.Email.Text
    };

    using var client = new MailKit.Net.Smtp.SmtpClient();
    var secureSocketOptions = port == 465
        ? SecureSocketOptions.SslOnConnect
        : SecureSocketOptions.StartTls;

    await client.ConnectAsync(host, port, secureSocketOptions);
    client.AuthenticationMechanisms.Remove("XOAUTH2");
    await client.AuthenticateAsync(username, password);
    var smtpResponse = await client.SendAsync(message);
    Console.WriteLine($"SMTP send response: {smtpResponse}");
    await client.DisconnectAsync(true);
}

static string BuildContactEmailBody(ContactForm form)
{
    return $"""
        Nome: {form.FirstName} {form.LastName}
        Email: {form.Email}
        Tipologia: {form.Type}
        Oggetto: {form.Subject}

        Messaggio:
        {form.Message}
        """;
}

static async Task<string?> SaveUploadedFile(IFormFile? file, string uploadsPath, string resourceFolder, string kind)
{
    if (file is null || file.Length == 0)
    {
        return null;
    }

    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var allowedExtensions = kind switch
    {
        "pdf" => [".pdf"],
        "video" => [".mp4"],
        _ => new[] { ".jpg", ".jpeg", ".png" }
    };

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

    return $"/uploads/{resourceFolder}/{fileName}";
}

static async Task<IReadOnlyList<string>> SaveUploadedFiles(IReadOnlyList<IFormFile> files, string uploadsPath, string resourceFolder, string kind)
{
    var savedFiles = new List<string>();

    foreach (var file in files)
    {
        var savedFile = await SaveUploadedFile(file, uploadsPath, resourceFolder, kind);

        if (!string.IsNullOrWhiteSpace(savedFile))
        {
            savedFiles.Add(savedFile);
        }
    }

    return savedFiles;
}

string ToPublicUrl(string value, string uploadsPath, string fallbackFileName, string resourceFolder = "teachings")
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return $"{publicBaseUrl}/uploads/{resourceFolder}/{fallbackFileName}";
    }

    var uploadsPrefix = $"/uploads/{resourceFolder}/";
    var publicUploadsPrefix = $"{publicBaseUrl}{uploadsPrefix}";

    if (value.StartsWith(publicUploadsPrefix, StringComparison.OrdinalIgnoreCase))
    {
        var fileName = Path.GetFileName(new Uri(value).LocalPath);
        return File.Exists(Path.Combine(uploadsPath, fileName))
            ? value
            : $"{publicBaseUrl}{uploadsPrefix}{fallbackFileName}";
    }

    if (value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
        value.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
    {
        return value;
    }

    var path = value.StartsWith('/') ? value : $"{uploadsPrefix}{value}";
    var localFileName = Path.GetFileName(path);

    if (path.StartsWith(uploadsPrefix, StringComparison.OrdinalIgnoreCase) &&
        !File.Exists(Path.Combine(uploadsPath, localFileName)))
    {
        return $"{publicBaseUrl}{uploadsPrefix}{fallbackFileName}";
    }

    return $"{publicBaseUrl}{path}";
}

static string[] SplitGallery(string value)
{
    return value
        .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

static string RenderLogin(string? error = null)
{
    var errorMarkup = string.IsNullOrWhiteSpace(error)
        ? string.Empty
        : $"""<div class="error">{Html(error)}</div>""";

    return $$"""
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Dashboard Login</title>
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
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    min-height: 100vh;
                    margin: 0;
                    display: grid;
                    place-items: center;
                    padding: 24px;
                    font-family: Arial, Helvetica, sans-serif;
                    background: var(--bg);
                    color: var(--text);
                }

                main {
                    width: min(420px, 100%);
                    background: var(--panel);
                    border: 1px solid var(--line);
                    border-radius: 8px;
                    overflow: hidden;
                }

                h1 {
                    margin: 0;
                    padding: 20px;
                    border-bottom: 1px solid var(--line);
                    font-size: 22px;
                }

                form {
                    display: grid;
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

                .error {
                    margin: 20px 20px 0;
                    color: var(--danger);
                    font-size: 14px;
                    font-weight: 700;
                }
            </style>
        </head>
        <body>
            <main>
                <h1>Dashboard Login</h1>
                {{errorMarkup}}
                <form method="post" action="/login">
                    <label>
                        Username
                        <input name="username" required autocomplete="username">
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" required autocomplete="current-password">
                    </label>
                    <button type="submit">Login</button>
                </form>
            </main>
        </body>
        </html>
        """;
}

static string RenderDashboard(
    IReadOnlyCollection<Teaching> teachings,
    IReadOnlyCollection<FashionDesign> fashionDesigns,
    IReadOnlyCollection<CostumeDesign> costumeDesigns)
{
    var teachingRows = new StringBuilder();
    var teachingList = teachings.ToList();

    for (var index = 0; index < teachingList.Count; index++)
    {
        var teaching = teachingList[index];
        teachingRows.Append($"""
            <tr data-order-row>
                <td>{Html(teaching.Title)}</td>
                <td>{Html(teaching.Author)}</td>
                <td>{Html(teaching.School)}</td>
                <td><code>{Html(teaching.PreviewImage)}</code></td>
                <td><code>{Html(teaching.PdfUrl)}</code></td>
                <td>
                    {RenderRowActions("teachings", teaching.Id, index == 0, index == teachingList.Count - 1)}
                </td>
            </tr>
            """);
    }

    var teachingEmptyState = teachings.Count == 0
        ? """<tr><td colspan="6" class="empty">No teachings in the database yet.</td></tr>"""
        : string.Empty;
    var fashionDesignRows = new StringBuilder();
    var fashionDesignList = fashionDesigns.ToList();

    for (var index = 0; index < fashionDesignList.Count; index++)
    {
        var entry = fashionDesignList[index];
        var galleryItems = string.Join("<br>", SplitGallery(entry.Gallery).Select(item => $"<code>{Html(item)}</code>"));

        fashionDesignRows.Append($"""
            <tr data-order-row>
                <td>{Html(entry.Title)}</td>
                <td><code>{Html(entry.ExplainingVideo)}</code></td>
                <td>{Html(entry.Description)}</td>
                <td>{galleryItems}</td>
                <td><code>{Html(entry.PdfUrl)}</code></td>
                <td>
                    {RenderRowActions("fashion-designs", entry.Id, index == 0, index == fashionDesignList.Count - 1)}
                </td>
            </tr>
            """);
    }

    var fashionDesignEmptyState = fashionDesigns.Count == 0
        ? """<tr><td colspan="6" class="empty">No fashion design entries in the database yet.</td></tr>"""
        : string.Empty;
    var costumeDesignRows = new StringBuilder();
    var costumeDesignList = costumeDesigns.ToList();

    for (var index = 0; index < costumeDesignList.Count; index++)
    {
        var entry = costumeDesignList[index];
        var galleryItems = string.Join("<br>", SplitGallery(entry.Gallery).Select(item => $"<code>{Html(item)}</code>"));
        var visibility = entry.Visible ? "Visible" : "Hidden";

        costumeDesignRows.Append($"""
            <tr data-order-row>
                <td>{Html(entry.Title)}</td>
                <td>{Html(entry.Season)}</td>
                <td>{Html(entry.Role)}</td>
                <td><code>{Html(entry.Video)}</code></td>
                <td>{galleryItems}</td>
                <td>{Html(entry.Description)}</td>
                <td>{Html(entry.Credits).Replace("\n", "<br>")}</td>
                <td>{visibility}</td>
                <td>
                    {RenderRowActions("costume-designs", entry.Id, index == 0, index == costumeDesignList.Count - 1)}
                </td>
            </tr>
            """);
    }

    var costumeDesignEmptyState = costumeDesigns.Count == 0
        ? """<tr><td colspan="9" class="empty">No costume design entries in the database yet.</td></tr>"""
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

                .session {
                    display: flex;
                    gap: 14px;
                    align-items: center;
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

                .group-title {
                    margin: 34px 0 12px;
                    color: var(--text);
                    font-size: 22px;
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

                .field-type {
                    color: var(--muted);
                    font-size: 12px;
                    font-weight: 400;
                }

                input,
                textarea {
                    width: 100%;
                    border: 1px solid var(--line);
                    border-radius: 6px;
                    padding: 10px 12px;
                    font: inherit;
                    color: var(--text);
                    background: #fff;
                }

                textarea {
                    min-height: 96px;
                    resize: vertical;
                }

                input[type="checkbox"] {
                    width: auto;
                    justify-self: start;
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

                button:disabled {
                    cursor: not-allowed;
                    opacity: 0.45;
                }

                button.move {
                    background: #394b59;
                    padding: 7px 10px;
                    font-size: 13px;
                    white-space: nowrap;
                }

                button.move:hover:not(:disabled) {
                    background: #2c3a45;
                }

                button.secondary {
                    background: #394b59;
                    white-space: nowrap;
                }

                button.secondary:hover {
                    background: #2c3a45;
                }

                button.logout {
                    background: #394b59;
                    padding: 7px 10px;
                    font-size: 13px;
                }

                button.logout:hover {
                    background: #2c3a45;
                }

                .table-wrap {
                    overflow-x: auto;
                }

                .actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    min-width: 236px;
                }

                .actions form {
                    margin: 0;
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
                    <div class="session">
                        <div class="count">{{teachings.Count}} teaching{{(teachings.Count == 1 ? string.Empty : "s")}} | {{fashionDesigns.Count}} fashion design entr{{(fashionDesigns.Count == 1 ? "y" : "ies")}} | {{costumeDesigns.Count}} costume design entr{{(costumeDesigns.Count == 1 ? "y" : "ies")}}</div>
                        <form method="post" action="/logout">
                            <button class="logout" type="submit">Logout</button>
                        </form>
                    </div>
                </header>

                <h2 class="group-title">Teachings</h2>
                <section>
                    <div class="section-title">Add teaching</div>
                    <form class="add" method="post" action="/dashboard/teachings" enctype="multipart/form-data">
                        <label>
                            Title
                            <span class="field-type">Text</span>
                            <input name="title" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Author
                            <span class="field-type">Text</span>
                            <input name="author" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            School
                            <span class="field-type">Text</span>
                            <input name="school" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Preview image
                            <span class="field-type">Image file: JPEG or PNG</span>
                            <span class="file-picker">
                                <input id="previewImage" name="previewImage" maxlength="500" value="/uploads/teachings/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="previewImageFile">Browse</button>
                                <input id="previewImageFile" name="previewImageFile" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" data-target="previewImage">
                            </span>
                        </label>
                        <label class="wide">
                            PDF URL
                            <span class="field-type">PDF file</span>
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
                    <div class="section-title">Teaching resources</div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>School</th>
                                    <th>Preview image</th>
                                    <th>PDF URL</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{teachingRows}}
                                {{teachingEmptyState}}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <div class="section-title">Add fashion design</div>
                    <form class="add" method="post" action="/dashboard/fashion-designs" enctype="multipart/form-data">
                        <label>
                            Title
                            <span class="field-type">Text</span>
                            <input name="title" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Explaining video
                            <span class="field-type">MP4 video file</span>
                            <span class="file-picker">
                                <input id="explainingVideo" name="explainingVideo" maxlength="500" value="/uploads/fashion-designs/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="explainingVideoFile">Browse</button>
                                <input id="explainingVideoFile" name="explainingVideoFile" type="file" accept="video/mp4,.mp4" data-target="explainingVideo" data-upload-folder="/uploads/fashion-designs/">
                            </span>
                        </label>
                        <label class="wide">
                            Description
                            <span class="field-type">Text</span>
                            <input name="description" required maxlength="2000" autocomplete="off">
                        </label>
                        <label class="wide">
                            Gallery
                            <span class="field-type">Images: multiple JPEG or PNG files</span>
                            <span class="file-picker">
                                <input id="gallery" name="gallery" maxlength="4000" value="/uploads/fashion-designs/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="galleryFiles">Browse</button>
                                <input id="galleryFiles" name="galleryFiles" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple data-target="gallery" data-upload-folder="/uploads/fashion-designs/">
                            </span>
                        </label>
                        <label class="wide">
                            PDF URL
                            <span class="field-type">PDF file</span>
                            <span class="file-picker">
                                <input id="fashionPdfUrl" name="pdfUrl" maxlength="500" value="/uploads/fashion-designs/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="fashionPdfFile">Browse</button>
                                <input id="fashionPdfFile" name="fashionPdfFile" type="file" accept="application/pdf,.pdf" data-target="fashionPdfUrl" data-upload-folder="/uploads/fashion-designs/">
                            </span>
                        </label>
                        <div class="wide">
                            <button type="submit">Add to database</button>
                        </div>
                    </form>
                </section>

                <section>
                    <div class="section-title">Fashion design resources</div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Explaining video</th>
                                    <th>Description</th>
                                    <th>Gallery</th>
                                    <th>PDF URL</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{fashionDesignRows}}
                                {{fashionDesignEmptyState}}
                            </tbody>
                        </table>
                    </div>
                </section>

                <h2 class="group-title">Costume Design</h2>
                <section>
                    <div class="section-title">Add costume design</div>
                    <form class="add" method="post" action="/dashboard/costume-designs" enctype="multipart/form-data">
                        <label>
                            Title
                            <span class="field-type">Text</span>
                            <input name="title" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Theater company
                            <span class="field-type">Text</span>
                            <input name="season" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Role
                            <span class="field-type">Text</span>
                            <input name="role" required maxlength="200" autocomplete="off">
                        </label>
                        <label>
                            Video
                            <span class="field-type">Optional MP4 video file</span>
                            <span class="file-picker">
                                <input id="costumeVideo" name="video" maxlength="500" value="/uploads/costume-designs/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="costumeVideoFile">Browse</button>
                                <input id="costumeVideoFile" name="costumeVideoFile" type="file" accept="video/mp4,.mp4" data-target="costumeVideo" data-upload-folder="/uploads/costume-designs/">
                            </span>
                        </label>
                        <label class="wide">
                            Gallery
                            <span class="field-type">Images: multiple JPEG or PNG files</span>
                            <span class="file-picker">
                                <input id="costumeGallery" name="gallery" maxlength="4000" value="/uploads/costume-designs/" autocomplete="off">
                                <button class="secondary" type="button" data-file-button="costumeGalleryFiles">Browse</button>
                                <input id="costumeGalleryFiles" name="costumeGalleryFiles" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" multiple data-target="costumeGallery" data-upload-folder="/uploads/costume-designs/">
                            </span>
                        </label>
                        <label class="wide">
                            Description
                            <span class="field-type">Text</span>
                            <input name="description" required maxlength="2000" autocomplete="off">
                        </label>
                        <label class="wide">
                            Credits
                            <span class="field-type">Text, supports multiple lines</span>
                            <textarea name="credits" required maxlength="4000"></textarea>
                        </label>
                        <label>
                            Visible on portfolio
                            <span class="field-type">Checkbox</span>
                            <input name="visible" type="checkbox" checked>
                        </label>
                        <div class="wide">
                            <button type="submit">Add to database</button>
                        </div>
                    </form>
                </section>

                <section>
                    <div class="section-title">Costume design resources</div>
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Theater company</th>
                                    <th>Role</th>
                                    <th>Video</th>
                                    <th>Gallery</th>
                                    <th>Description</th>
                                    <th>Credits</th>
                                    <th>Portfolio</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{costumeDesignRows}}
                                {{costumeDesignEmptyState}}
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

                        const uploadFolder = fileInput.dataset.uploadFolder || "/uploads/teachings/";
                        const fileNames = Array.from(fileInput.files).map((selectedFile) => `${uploadFolder}${selectedFile.name}`);
                        document.getElementById(fileInput.dataset.target).value = fileNames.join("|");
                    });
                });

                document.querySelectorAll("form[data-move-form]").forEach((form) => {
                    form.addEventListener("submit", async (event) => {
                        event.preventDefault();

                        const button = form.querySelector("button");

                        if (!button || button.disabled) {
                            return;
                        }

                        const row = form.closest("[data-order-row]");
                        const tbody = row && row.parentElement;
                        const direction = form.dataset.moveForm;

                        if (!row || !tbody) {
                            form.submit();
                            return;
                        }

                        button.disabled = true;

                        try {
                            const response = await fetch(form.action, {
                                method: "POST",
                                credentials: "same-origin"
                            });

                            if (!response.ok) {
                                throw new Error("Move request failed.");
                            }

                            if (direction === "up" && row.previousElementSibling) {
                                tbody.insertBefore(row, row.previousElementSibling);
                            }

                            if (direction === "down" && row.nextElementSibling) {
                                tbody.insertBefore(row.nextElementSibling, row);
                            }

                            updateMoveButtons(tbody);
                        } catch {
                            form.submit();
                        }
                    });
                });

                function updateMoveButtons(tbody) {
                    const rows = Array.from(tbody.querySelectorAll("[data-order-row]"));

                    rows.forEach((row, index) => {
                        const upButton = row.querySelector("form[data-move-form='up'] button");
                        const downButton = row.querySelector("form[data-move-form='down'] button");

                        if (upButton) {
                            upButton.disabled = index === 0;
                        }

                        if (downButton) {
                            downButton.disabled = index === rows.length - 1;
                        }
                    });
                }
            </script>
        </body>
        </html>
        """;
}

static string Html(string value)
{
    return WebUtility.HtmlEncode(value);
}

static string RenderRowActions(string resource, int id, bool isFirst, bool isLast)
{
    var upDisabled = isFirst ? " disabled" : string.Empty;
    var downDisabled = isLast ? " disabled" : string.Empty;

    return $"""
        <div class="actions">
            <form method="post" action="/dashboard/{resource}/{id}/move-up" data-move-form="up">
                <button class="move" type="submit"{upDisabled}>Metti sopra</button>
            </form>
            <form method="post" action="/dashboard/{resource}/{id}/move-down" data-move-form="down">
                <button class="move" type="submit"{downDisabled}>Metti sotto</button>
            </form>
            <form method="post" action="/dashboard/{resource}/{id}/delete">
                <button class="danger" type="submit">Delete</button>
            </form>
        </div>
        """;
}

sealed class PersonalWebsiteDbContext(DbContextOptions<PersonalWebsiteDbContext> options) : DbContext(options)
{
    public DbSet<Teaching> Teachings => Set<Teaching>();
    public DbSet<FashionDesign> FashionDesigns => Set<FashionDesign>();
    public DbSet<CostumeDesign> CostumeDesigns => Set<CostumeDesign>();

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

            entity.Property(teaching => teaching.DisplayOrder)
                .HasColumnName("display_order")
                .HasDefaultValue(0)
                .IsRequired();
        });

        modelBuilder.Entity<FashionDesign>(entity =>
        {
            entity.ToTable("fashion_designs");
            entity.HasKey(entry => entry.Id);

            entity.Property(entry => entry.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(entry => entry.ExplainingVideo)
                .HasColumnName("explaining_video")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(entry => entry.Description)
                .HasColumnName("description")
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(entry => entry.Gallery)
                .HasColumnName("gallery")
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(entry => entry.PdfUrl)
                .HasColumnName("pdf_url")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(entry => entry.DisplayOrder)
                .HasColumnName("display_order")
                .HasDefaultValue(0)
                .IsRequired();
        });

        modelBuilder.Entity<CostumeDesign>(entity =>
        {
            entity.ToTable("costume_designs");
            entity.HasKey(entry => entry.Id);

            entity.Property(entry => entry.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(entry => entry.Season)
                .HasColumnName("season")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(entry => entry.Role)
                .HasColumnName("role")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(entry => entry.Video)
                .HasColumnName("video")
                .HasMaxLength(500)
                .HasDefaultValue(string.Empty)
                .IsRequired();

            entity.Property(entry => entry.Gallery)
                .HasColumnName("gallery")
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(entry => entry.Description)
                .HasColumnName("description")
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(entry => entry.Credits)
                .HasColumnName("credits")
                .HasMaxLength(4000)
                .IsRequired();

            entity.Property(entry => entry.Visible)
                .HasColumnName("visible")
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(entry => entry.DisplayOrder)
                .HasColumnName("display_order")
                .HasDefaultValue(0)
                .IsRequired();
        });
    }
}

interface IOrderedDashboardEntry
{
    int Id { get; }

    int DisplayOrder { get; set; }
}

enum MoveDirection
{
    Up,
    Down
}

sealed class Teaching : IOrderedDashboardEntry
{
    public int Id { get; set; }

    public required string Title { get; set; }

    public required string Author { get; set; }

    public required string School { get; set; }

    public required string PreviewImage { get; set; }

    public required string PdfUrl { get; set; }

    public int DisplayOrder { get; set; }
}

sealed record TeachingCardDto(
    string Title,
    string Author,
    string School,
    string PreviewImage,
    string PdfUrl);

sealed class FashionDesign : IOrderedDashboardEntry
{
    public int Id { get; set; }

    public required string Title { get; set; }

    public required string ExplainingVideo { get; set; }

    public required string Description { get; set; }

    public required string Gallery { get; set; }

    public required string PdfUrl { get; set; }

    public int DisplayOrder { get; set; }
}

sealed record FashionDesignDto(
    string Title,
    string ExplainingVideo,
    string Description,
    string[] Gallery,
    string PdfUrl);

sealed class CostumeDesign : IOrderedDashboardEntry
{
    public int Id { get; set; }

    public required string Title { get; set; }

    public required string Season { get; set; }

    public required string Role { get; set; }

    public string Video { get; set; } = string.Empty;

    public required string Gallery { get; set; }

    public required string Description { get; set; }

    public required string Credits { get; set; }

    public bool Visible { get; set; } = true;

    public int DisplayOrder { get; set; }
}

sealed record CostumeDesignDto(
    string Title,
    string Season,
    string Role,
    string Video,
    string[] Gallery,
    string Description,
    string Credits);

sealed record ContactRequest(
    string? RecipientEmail,
    ContactForm Form,
    ContactEmail? Email,
    DateTimeOffset? CreatedAt,
    string? Source);

sealed record ContactForm(
    string FirstName,
    string LastName,
    string Email,
    string Type,
    string Subject,
    string Message);

sealed record ContactEmail(
    string? ReplyTo,
    string? Subject,
    string? Text);

