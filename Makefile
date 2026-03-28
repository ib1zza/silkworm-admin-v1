.PHONY: dev install build preview api-gen deploy

dev:
	npm run dev

install:
	npm install

build:
	npm run build

preview:
	npm run preview

api-gen:
	npm run api:gen

deploy:
	powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1
