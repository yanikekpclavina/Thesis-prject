to create virtual environment
python -m venv venv

Activate the virtual environment
venv\Scripts\activate

Running the flax app
python app.py

running the Server.js
Npm start

Running Docker
docker-compose up -d

 test Postman API
 POST http://localhost:5000/signup
 {
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "securepass"
}


Signin
POST http://localhost:5000/login
{
  "username": "johndoe",
  "password": "securepass"
}

Updateprofile
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "username": "johnsmith"
}

Ai analysis
Method: POST

URL: http://localhost:5000/analyze-art

Headers: (Set automatically)

Body (form-data):

Key: artwork (type: file)

Upload an image file

Purchase
{
  "card_number": "4242424242424242",
  "expiry_date": "12/26",
  "cvv": "123"
}
