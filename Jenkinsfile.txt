pipeline {
    agent any

    environment {
        IMAGE_NAME = "flowtrack"
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

        stage('Build Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    cd ${DEPLOY_DIR}
                    docker compose down
                    docker compose up -d
                """
            }
        }

    }
    
}
