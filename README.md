# How to make an API using Node.js and Express, Dockerize it and deploy it to Cloud Run on GCP


#### We are going to do the following:
1. Create a new service called express-api.
2. Deploy the Docker image to the specified region.
3. Provide a service URL upon successful deployment.


### Step 1: Create an Express API
1. Initialize a Node.js Project:
```bash
mkdir express-api
cd express-api
npm init -y
```

2. Install Dependencies:
```bash
npm install express
```

3. Create the API: 

Create a file named ```index.js```

```bash
touch index.js
```
4. Populate code with below:

```js
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
```

### Step 2. Containerize the API with Docker
1. Create a Dockerfile:
```bash
touch Dockerfile 
```

2. Populate file with:
```dockerfile
# Use Node.js LTS version
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port and start the server
EXPOSE 8080
CMD ["node", "index.js"]
```

3. Install Docker Desktop
    1. Download Docker Desktop:
        * Visit the Docker Desktop for Windows download page and install Docker Desktop
        * https://docs.docker.com/desktop/setup/install/windows-install/
    
    2. Install WSL 2 (if not already installed):
        * Follow Microsoft's WSL 2 setup guide.
        * https://learn.microsoft.com/en-us/windows/wsl/install
    
    3. Enable WSL 2 Integration in Docker Desktop:
    
        * Open Docker Desktop.
        * Go to Settings > Resources > WSL Integration.
        * Enable Enable integration with my default WSL distro or select the specific distro (e.g., ```Ubuntu```).
    4. Restart Docker Desktop:
        * Restart Docker Desktop to apply the changes.



4. Build the Docker Image:

```bash
docker build -t express-api .
```

5. Run Locally for Testing:
```bash 
docker run -p 8080:8080 express-api
```
Visit ```http://localhost:8080``` to confirm the API is working.


### Step 3: Deploy to Google Cloud Run
1. Authenticate with Google Cloud:
```bash
gcloud auth login
gcloud config set project [PROJECT_ID]
```


2. Enable Required Services:
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

3. Push the Docker Image to Google Artifact Registry:



* Configure Docker Authentication for Google Artifact Registry

Run the following command to configure Docker to use your Google credentials:

```bash
gcloud auth configure-docker us-docker.pkg.dev
```
This updates your Docker configuration to authenticate with Google Artifact Registry.


* Verify the Repository
Ensure the Artifact Registry repository (```gcr.io```) exists in your project. List your repositories:
```bash
gcloud artifacts repositories list --location=us
```

If the repository is missing, create it:
```bash
gcloud artifacts repositories create gcr.io \
    --repository-format=DOCKER \
    --location=us \
    --description="Docker repository for Express API project"
```

* Tag the image:
```bash
docker tag express-api us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api

```
Replace ```[PROJECT_ID]``` with your actual project ID.


##### Why do we tag? (***More details below in FAQ***)

> 1. Identify and Version Your Image
> 2. Specify the Image Destination
> 3. Enable Continuous Deployment
> 4. Avoid Confusion in Multi-Image Repositories
> 5. Simplify Debugging and Rollbacks




* Push the image:
```bash 
docker push us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api
```



### Step 4. Deploy the Image to Cloud Run:
```bash
gcloud run deploy express-api \
    --image us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api \
    --platform managed \
    --region [REGION] \
    --allow-unauthenticated

```
Replace the placeholders:

```[PROJECT_ID]```: Your Google Cloud project ID.

```[REGION]```: The region for deployment (e.g., us-central1, us-east1).

#### Explanation of the Flags
*```--image```: Specifies the Docker image to deploy.

*```--platform managed```: Deploys to the fully managed Cloud Run platform.

*```--region```: The region where your Cloud Run service will run.

*```--allow-unauthenticated```: Makes the service accessible to the public. Remove this flag if you want to restrict access.



#### Wait for Deployment
After running the command, Cloud Run will:

1. Create a new service called express-api.
2. Deploy the Docker image to the specified region.
3. Provide a service URL upon successful deployment.

Example output:
```less
Service [express-api] revision [express-api-00001] has been deployed and is serving traffic at:
https://express-api-xyz-uc.a.run.app
```

From here, you can add features to your API or use environment variables to integrate additional services!



### Test the Service
Open the URL provided in the output in your browser, or test it with ```curl```:
```bash
curl https://express-api-xyz-uc.a.run.app
```

If your API is working, you'll see a response, such as:

```
Hello, World!
```


### Update the Service (if Needed)
To redeploy an updated version of your API, simply push a new image to Artifact Registry and redeploy:
```bash
docker build -t us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api .
```
```bash
docker push us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api
```
```bash
gcloud run deploy express-api \
    --image us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api \
    --platform managed \
    --region [REGION] \
    --allow-unauthenticated
```


### View Logs

You can view logs for your Cloud Run service using this command:

```bash 
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=express-api" --limit 50
```



### Monitor and Manage the Service
* **Cloud Run Console**: Manage your service in the Google Cloud Run Console.
* **Scaling and Traffic**: Cloud Run automatically scales your service based on incoming traffic.


# Coming Up

In the upcoming commits, we'll explore:

- **Using Environment Variables**: Learn how to securely store and use sensitive configurations like API keys.
- **Connecting to a Database**: Integrate your API with Google Cloud SQL or Firestore for dynamic data storage.
- **Authentication**: Add security to your API using OAuth 2.0 or JWTs.
- **Continuous Deployment**: Automate deployments with CI/CD pipelines.
- **Logging and Monitoring**: Enable Cloud Logging and Monitoring to track usage and performance.
- **Rate Limiting**: Protect your API from abuse with request throttling.

Stay tuned for these enhancements to take your deployment to the next level!

 
# FAQ

### Why do we tag?
Tagging a Docker build is crucial for organizing and managing your container images effectively, especially when deploying to services like Google Cloud Run. Here's why we tag Docker builds:

#### 1. Identify and Version Your Image

A tag serves as a human-readable identifier for your Docker image. Instead of referencing long, auto-generated image IDs, you can use meaningful tags like ```v1.0```, ```latest```, or ```feature-x```.

For example:

```bash
docker build -t my-app:1.0 .
```
This makes it easy to track which version of your application is being deployed.

#### 2. Specify the Image Destination
When pushing an image to a container registry like Google Artifact Registry, you need to specify the full path where the image will be stored. Tags help define this path:

```bash
docker tag express-api us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api
```
Here:

* ```us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api``` specifies the registry and repository.
* The tag ensures the image is associated with the correct destination.

#### 3. Enable Continuous Deployment
Tags make it easier to automate deployments. For instance:

Use ```latest``` to always deploy the most recent image:
```bash
docker tag my-app:latest us-docker.pkg.dev/my-project/gcr.io/my-app:latest
```

Use version tags for rolling back to specific versions:
```bash
docker tag my-app:2.0 us-docker.pkg.dev/my-project/gcr.io/my-app:2.0
```

#### 4. Avoid Confusion in Multi-Image Repositories
If multiple images are stored in the same repository, tags distinguish between them:

* ```gcr.io/my-project/my-app:backend```
* ```gcr.io/my-project/my-app:frontend```
#### 5. Simplify Debugging and Rollbacks
If an issue arises, tags help identify and rollback to a specific version of the image. For example:

```bash
gcloud run deploy express-api \
    --image us-docker.pkg.dev/[PROJECT_ID]/gcr.io/express-api:v1.0
```    

### Summary
Tagging is a best practice to:

* Version your images.
* Simplify deployment processes.
* Enable automation and rollbacks.
* Manage images in registries.

Always tag your Docker builds with meaningful and descriptive identifiers!

