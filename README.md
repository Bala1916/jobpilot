# JobPilot prototype

A mobile-friendly, static job-search and resume-tailoring prototype for GitHub Pages.

## Features
- Search the web using Google and Bing, plus shortcuts for LinkedIn, Naukri, Indeed, and company career pages.
- Save job titles, original application URLs, and descriptions in this browser.
- Upload PDF, DOCX, or TXT resume files and extract their text in the browser.
- Save a master resume in browser `localStorage`.
- View a rough keyword-overlap indicator for a saved job.
- Generate a Word (`.docx`) draft from existing resume content.
- No automatic applications are submitted.

## Important limitations
- GitHub Pages is static hosting. It does not run a private backend or provide a universal job-search API.
- The search feature opens live search engine / portal pages; it does not aggregate all results into one automatically populated list.
- Portal access, search URLs, and available listings can change. Some portals restrict automated access.
- Resume tailoring is a simple prototype, not a full AI rewrite or a validated ATS score. Always review all output.
- Resume text and saved jobs are stored in this browser on this device. Clearing site data may erase them. Keep a backup.
- Libraries for PDF/DOCX reading and Word export load from public CDNs, so an internet connection is required for those features.
- Do not put private API keys or secrets in this repository.

## Deploy from a mobile browser
1. Sign in at https://github.com.
2. Tap `+` and choose **New repository**.
3. Repository name: `jobpilot`. Choose **Public** if you want to use GitHub Pages on a free GitHub account; keep in mind that public repository files are visible to everyone.
4. Create the repository. Do not add a README yet (optional; either way is okay).
5. In the repository, choose **Add file → Upload files**.
6. Upload `index.html`, `style.css`, and `app.js` from this ZIP. You can also upload `README.md`.
7. Commit the files to the `main` branch.
8. Open **Settings → Pages**.
9. Under **Build and deployment**, choose **Deploy from a branch**.
10. Select branch `main` and folder `/(root)`, then Save.
11. Wait for the deployment to finish. Your site URL will usually be `https://YOUR-USERNAME.github.io/jobpilot/`.
12. Open the URL in your mobile browser. Upload and save your resume in the **My resume** tab.

## Privacy reminder
Treat the master resume as sensitive personal data. Browser storage is not encrypted by this app. Use a personal device, avoid shared devices, and retain a secure backup.
