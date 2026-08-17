# Production Environment

## Backend

Set these variables on the production host before starting `PersonalWebsiteServer`:

```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:5109
PUBLIC_BASE_URL=https://api.example.com
CORS_ALLOWED_ORIGINS=https://www.example.com,https://example.com
ConnectionStrings__PersonalWebsite=Data Source=/var/lib/personal-website/personal-website.db
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=change-this-password
CONTACT_DESTINATION_EMAIL=mariasole.freelancer@libero.it
SMTP_HOST=smtp.libero.it
SMTP_PORT=465
SMTP_USER=mariasole.freelancer@libero.it
SMTP_PASSWORD=change-this-smtp-password
SMTP_FROM_EMAIL=mariasole.freelancer@libero.it
```

Use `PersonalWebsite_Backend/PersonalWebsiteServer/.env.production.example` as the backend template.

## Frontend

The browser app reads runtime configuration from `app-config.js`.

For same-origin deployments, keep:

```js
window.__APP_CONFIG__ = {
  apiBaseUrl: '',
  resourceBaseUrl: ''
};
```

For a separate backend API domain, deploy `public/app-config.js` with:

```js
window.__APP_CONFIG__ = {
  apiBaseUrl: 'https://api.example.com',
  resourceBaseUrl: 'https://api.example.com'
};
```

Use `PersonalWebsite_Frontend/public/app-config.production.example.js` as the production template.
