# Deploying to Wasmer Static Site from GitHub

## GitHub Integration Steps:

1. **Push your code to GitHub:**
   - Make sure all your files are committed and pushed to your GitHub repository

2. **Connect GitHub to Wasmer:**
   - Go to https://wasmer.io/new
   - Click **"Import from GitHub"**
   - Authorize Wasmer to access your GitHub account
   - Select your `WebRanch` repository

3. **Configure Deployment:**
   - **Project Type**: Select "Static Website"
   - **Build Command**: Leave empty (or `echo 'No build needed'`)
   - **Publish Directory**: `.` (root directory)
   - Wasmer will automatically detect the `wasmer.toml` configuration

4. **Deploy:**
   - Click "Deploy" or "Create Project"
   - Wasmer will pull from your GitHub repo and deploy automatically

## Automatic Deployments:

Once connected, Wasmer will automatically redeploy whenever you push changes to your GitHub repository!

## Configuration:

The `wasmer.toml` file is configured to:
- Serve files from the root directory (`.`)
- Set the project name as "pokemon-ranch"

## Your Site Will Be Live At:
`https://pokemon-ranch.wasmer.app` (or similar URL provided after deployment)

## Notes:

- Wasmer Static Site hosting is **free**
- No build minutes are consumed (it's a static site)
- Automatic deployments on every GitHub push
- Free SSL certificates included

