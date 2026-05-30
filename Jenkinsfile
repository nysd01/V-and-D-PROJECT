pipeline {
    agent any

    environment {
        // Docker image names
        BACKEND_IMAGE  = "v-and-d-project-backend"
        FRONTEND_IMAGE = "v-and-d-project-frontend"
        IMAGE_TAG      = "${env.BUILD_NUMBER}"

        // Kubernetes namespace
        K8S_NAMESPACE  = "internconnect"
    }

    stages {

        // ── Stage 1: Checkout ──────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code from GitHub...'
                checkout scm
                sh 'echo "Branch: ${GIT_BRANCH}"'
                sh 'echo "Commit: ${GIT_COMMIT}"'
            }
        }

        // ── Stage 2: Install Backend Dependencies ──────────────────────────
        stage('Install Backend') {
            steps {
                echo '📦 Installing backend dependencies...'
                dir('backend') {
                    sh 'npm ci --only=production'
                }
            }
        }

        // ── Stage 3: Install Frontend Dependencies ─────────────────────────
        stage('Install Frontend') {
            steps {
                echo '📦 Installing frontend dependencies...'
                dir('frontend/InternConnect') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        // ── Stage 4: Run Backend Tests ─────────────────────────────────────
        stage('Test Backend') {
            steps {
                echo '🧪 Running backend unit and integration tests...'
                dir('backend') {
                    sh 'npm test -- --passWithNoTests --forceExit'
                }
            }
            post {
                always {
                    // Publish test results if JUnit XML reports are generated
                    junit allowEmptyResults: true, testResults: 'backend/test-results/**/*.xml'
                }
            }
        }

        // ── Stage 5: Run Frontend Tests ────────────────────────────────────
        stage('Test Frontend') {
            steps {
                echo '🧪 Running frontend component tests...'
                dir('frontend/InternConnect') {
                    sh 'npm test -- --passWithNoTests --watchAll=false'
                }
            }
        }

        // ── Stage 6: Build Backend Docker Image ────────────────────────────
        stage('Build Backend Image') {
            steps {
                echo "🐳 Building backend Docker image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh """
                    docker build \
                        -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend
                """
            }
        }

        // ── Stage 7: Build Frontend Docker Image ───────────────────────────
        stage('Build Frontend Image') {
            steps {
                echo "🐳 Building frontend Docker image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                sh """
                    docker build \
                        -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend/InternConnect
                """
            }
        }

        // ── Stage 8: Security Scan (Image Vulnerability Check) ─────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Scanning images for vulnerabilities...'
                sh """
                    docker scout cves ${BACKEND_IMAGE}:${IMAGE_TAG} --exit-code 0 || true
                """
            }
        }

        // ── Stage 9: Deploy to Kubernetes ──────────────────────────────────
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'           // Only deploy from main branch
            }
            steps {
                echo '🚀 Deploying to Kubernetes cluster...'
                sh 'kubectl apply -f k8s/namespace.yaml'
                sh 'kubectl apply -f k8s/configmap.yaml'
                sh 'kubectl apply -f k8s/secret.yaml'
                sh 'kubectl apply -f k8s/backend-deployment.yaml'
                sh 'kubectl apply -f k8s/backend-service.yaml'
                sh 'kubectl apply -f k8s/frontend-deployment.yaml'
                sh 'kubectl apply -f k8s/frontend-service.yaml'
                sh 'kubectl apply -f k8s/hpa.yaml'

                // Trigger rolling update with new image
                sh "kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}"
                sh "kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}"

                // Wait for rollout to complete
                sh "kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=120s"
                sh "kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=120s"
            }
        }

        // ── Stage 10: Health Check ─────────────────────────────────────────
        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                echo '❤️ Running post-deployment health check...'
                sh '''
                    sleep 10
                    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:30080/api/health)
                    if [ "$STATUS" = "200" ]; then
                        echo "✅ Health check passed — API is responding"
                    else
                        echo "❌ Health check failed — Status: $STATUS"
                        exit 1
                    fi
                '''
            }
        }

    }

    // ── Post-build Actions ─────────────────────────────────────────────────
    post {
        success {
            echo """
            ✅ Pipeline SUCCESS
            Build:    #${BUILD_NUMBER}
            Branch:   ${GIT_BRANCH}
            Images:   ${BACKEND_IMAGE}:${IMAGE_TAG}
                      ${FRONTEND_IMAGE}:${IMAGE_TAG}
            """
        }
        failure {
            echo """
            ❌ Pipeline FAILED at stage: ${STAGE_NAME}
            Build:  #${BUILD_NUMBER}
            Branch: ${GIT_BRANCH}
            Check logs above for details.
            """
        }
        always {
            // Clean up dangling Docker images after build
            sh 'docker image prune -f || true'
            echo '🧹 Workspace cleaned up'
        }
    }
}
