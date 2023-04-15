login:
	heroku login

deploy:
	git push heroku main

logs:
	heroku logs --tail
