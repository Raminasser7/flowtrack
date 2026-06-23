pipeline {
    agent any

    environment {
        REGISTRY = "docker.io/raminasser07"
        APP_NAME = "flowtrack"
        VERSION = "${BUILD_NUMBER}"
        BACKEND_IMAGE = "${REGISTRY}/${APP_NAME}-backend:latest"
        FRONTEND_IMAGE = "${REGISTRY}/${APP_NAME}-frontend:latest"
        DEPLOY_DIR = "/opt/finance_tracking"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'flowtrack-cred',
                    url: 'https://github.com/Raminasser7/flowtrack.git'
            }
        }

        stage('Login to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'flowtrack_dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                sh """
                    docker build -t ${BACKEND_IMAGE} ./backend
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                    docker build -t ${FRONTEND_IMAGE} ./frontend
                """
            }
        }

        stage('Push Images') {
            steps {
                sh """
                    docker push ${BACKEND_IMAGE}
                    docker push ${FRONTEND_IMAGE}
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    cd ${DEPLOY_DIR} && docker compose pull && docker compose up -d
                """
            }
        }

    }

    post {
        success {
            echo "✅ Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}