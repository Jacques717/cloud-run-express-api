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


# What It Means to Use Cloud Run for Your Express Node.js API

When your **Express Node.js API** is deployed to **Cloud Run**, it is hosted on **Google Cloud Platform (GCP)** in a fully managed, serverless environment. Here’s an overview of what that entails:

---

## Key Concepts of Cloud Run for Your Express API

1. **Serverless Deployment**
   - Your API runs in **containers** managed by Cloud Run.
   - No need to manage servers, scaling, or infrastructure.

2. **Autoscaling**
   - Cloud Run automatically scales your API to handle incoming requests.
   - Scales down to zero when there’s no traffic, reducing costs.

3. **Fully Managed**
   - Google takes care of server provisioning, patching, and maintenance.

4. **Exposed as a Service**
   - Your API is exposed via a **URL endpoint** (e.g., `https://your-api-xyz.a.run.app`).
   - Accessible over HTTP/HTTPS like any other REST API.

5. **Containerized Environment**
   - Cloud Run uses a Docker container to run your API.
   - You provide the Docker image, and Cloud Run handles the execution.

6. **Integration with GCP Services**
   - Your API can integrate with other GCP services like Firestore, Pub/Sub, or Cloud SQL.
   - Secure access to these services is handled via Google Cloud IAM.

---

## What Happens When You Use Cloud Run?

- **Request Handling**: Cloud Run routes incoming HTTP requests to your Express API.
- **On-Demand Instances**: Instances of your container are created only when traffic comes in, scaling up or down automatically.
- **Environment Variables**: Configure environment variables (e.g., API keys, database URLs) through the Cloud Run console.
- **Managed HTTPS**: Your API is secured with an HTTPS endpoint by default.

---

## Benefits of Using Cloud Run

1. **Ease of Deployment**
   - Simply push your Docker container, and Cloud Run takes care of the rest.

2. **Scalability**
   - Automatically handles increases and decreases in traffic.

3. **Cost Efficiency**
   - You only pay for what you use, based on request count and compute time.

4. **Secure by Default**
   - Built-in HTTPS and IAM-based access controls.

5. **Global Availability**
   - Deploy your API in multiple regions for low-latency access.

---

## Example Workflow

1. **Build and Containerize Your Express API**:
   - Use Docker to containerize your application.

2. **Push the Container to Google Artifact Registry**:
   - Tag and push the container image to GCP's container registry.

3. **Deploy the Container to Cloud Run**:
   - Run the following command to deploy your API:
     ```bash
     gcloud run deploy your-api \
         --image gcr.io/your-project-id/your-api-image \
         --platform managed \
         --region us-central1 \
         --allow-unauthenticated
     ```

4. **Access Your API**:
   - Once deployed, you’ll receive a unique Cloud Run URL where your API is live (e.g., `https://your-api-xyz.a.run.app`).

---

## Summary

By deploying your API to Cloud Run, you gain:
- Serverless hosting.
- Automatic scaling.
- Cost-efficient resource usage.
- Secure, globally accessible endpoints.
- The ability to focus on your application rather than infrastructure.

Cloud Run allows you to leverage GCP’s scalable and reliable infrastructure to make your API production-ready with minimal effort.


# Why Must You Use Docker?

Using Docker in the setup described above provides numerous advantages that make it a critical tool for deploying applications like an Express Node.js API to environments like **Google Cloud Run**. Here’s why Docker is essential:

---

## 1. **Consistency Across Environments**

- Docker ensures that your application runs the same way in development, testing, and production.
- The Docker container includes all dependencies, configurations, and the operating system environment, eliminating "it works on my machine" issues.

---

## 2. **Portability**

- Containers are portable and can run on any system with Docker installed, regardless of the underlying hardware or operating system.
- For deployment, a Docker containerized application can be easily pushed to a cloud service like Google Cloud Run.

---

## 3. **Isolation**

- Each Docker container runs in its own isolated environment, ensuring that your application doesn’t conflict with other applications or processes on the same system.
- This isolation includes libraries, dependencies, and even runtime versions.

---

## 4. **Ease of Deployment**

- Docker makes it simple to package your entire application, including all its dependencies, into a single container.
- Deploying to services like **Cloud Run** becomes straightforward as you only need to provide the container image.

---

## 5. **Efficient Resource Usage**

- Docker containers are lightweight compared to virtual machines because they share the host system’s kernel.
- This efficiency reduces overhead, enabling you to run more containers on the same hardware.

---

## 6. **Reproducibility**

- Docker images are version-controlled, meaning you can recreate the exact same environment by using the same image.
- This helps with debugging, testing, and ensuring consistent builds over time.

---

## 7. **Integration with Cloud Run**

- Cloud Run is designed to work with containerized applications. Docker allows you to easily create a container image for your application that can be deployed directly to Cloud Run.
- Services like Google Artifact Registry make managing Docker images seamless when paired with Cloud Run.

---

## 8. **Support for CI/CD Pipelines**

- Docker integrates well with continuous integration/continuous deployment (CI/CD) pipelines, making it easier to automate testing, building, and deploying your application.

---

## 9. **Community and Ecosystem**

- Docker has a vast community and ecosystem of pre-built images (e.g., `node:alpine`), which makes starting a new project faster and more efficient.
- You can rely on well-tested base images and customize them for your needs.

---

## Summary

Using Docker ensures that your application is:
- Portable and consistent across environments.
- Isolated from other applications and processes.
- Easy to deploy and manage in modern cloud services like Google Cloud Run.
- Efficient in terms of resources and reproducible for debugging and testing.

In short, Docker streamlines the entire application lifecycle, from local development to cloud deployment, making it an indispensable tool for modern software projects.




## Tech Stack

- **Backend API**: Node.js, Express
- **Containerization**: Docker
- **Serverless Deployment**: Google Cloud Run
- **Container Registry**: Google Artifact Registry
- **DevOps Tools**: Git, GitHub, Google Cloud Console