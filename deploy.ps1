Write-Host "Deploying Backend to Cloud Run..."
cd server
$backendUrl = gcloud run deploy peoples-priorities-backend --source . --region asia-south1 --allow-unauthenticated --min-instances=1 --max-instances=2 --session-affinity --set-env-vars="MONGODB_URI=mongodb+srv://konchadanishanth2643_db_user:ERGPnaorsyui25Vr@cluster0.tvfby7o.mongodb.net/peoples-priorities?retryWrites=true&w=majority&appName=Cluster0,GROQ_API_KEY=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,JWT_SECRET=supersecretjwtkey_hackathon_only" --format="value(status.url)" --quiet
cd ..

Write-Host "Backend deployed at: $backendUrl"

Write-Host "Updating Frontend to use Backend URL..."
cd client
(Get-Content src\pages\AdminLogin.tsx) -replace 'http://localhost:8080', $backendUrl | Set-Content src\pages\AdminLogin.tsx
(Get-Content src\pages\CitizenPortal.tsx) -replace 'http://localhost:8080', $backendUrl | Set-Content src\pages\CitizenPortal.tsx
(Get-Content src\pages\AdminDashboard.tsx) -replace 'http://localhost:8080', $backendUrl | Set-Content src\pages\AdminDashboard.tsx

Write-Host "Building Frontend..."
npm run build

Write-Host "Deploying Frontend to Firebase..."
firebase deploy --only hosting
cd ..

Write-Host "Deployment Complete!"
