# 🧭 Tourista – Full-Stack Travel Booking Application

**Tourista** is a full-stack travel booking web application built with **Node.js**, **Express**, and **MongoDB**.  
Originally inspired by Jonas Schmedtmann’s _Natours_ project, Tourista has been fully **rebranded and redesigned**, featuring performance optimizations, security improvements, and a modern UI.

---

## 🚀 Features

- 🗺️ **Tour Management**  
  Create, update, and view tours with details like duration, price, difficulty, and location data.

- 👤 **User Authentication & Authorization**  
  Secure signup, login, password reset, and role-based permissions using **JWT** and **bcrypt**.

- 💳 **Payment Integration**  
  Seamless **Stripe** checkout for booking tours securely and easily.

- ⚙️ **Performance Optimization**  
  Query performance improved with **MongoDB indexing** and **aggregation pipelines**, reducing response time and database load.

- 🔒 **Advanced Security**  
  Implemented **rate limiting**, **data sanitization**, and **secure HTTP headers (Helmet)** to protect against brute-force, NoSQL injection, and XSS attacks.

- 🎨 **Modern Front-End**  
  Redesigned and rebranded interface using **Pug templates**, **CSS**, and **JavaScript**, introducing a clean and responsive “Tourista” look.

---

## 🧰 Tech Stack

| Layer              | Technologies                                          |
| ------------------ | ----------------------------------------------------- |
| **Backend**        | Node.js, Express.js                                   |
| **Database**       | MongoDB, Mongoose                                     |
| **Frontend**       | Pug, CSS, JavaScript                                  |
| **Authentication** | JWT, bcrypt                                           |
| **Payments**       | Stripe API                                            |
| **Security**       | express-rate-limit, Helmet, mongo-sanitize, xss-clean |
| **Deployment**     | MongoDB Atlas, Render / Heroku (optional)             |

---

## 🏗️ Project Architecture

The app follows the **MVC (Model–View–Controller)** architecture for clean separation of concerns:
project/

```bash
project/
│
├── controllers/        # Route logic and API controllers
├── models/             # Mongoose schemas
├── routes/             # API and view routes
├── public/             # Static assets (CSS, JS, images)
├── views/              # Pug templates
├── utils/              # Utility modules (email, error handling, etc.)
└── server.js           # Entry point
```

---

## ⚡ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/AhmedMahmoudEG/Tourista.git
cd Tourista
```

## 2️⃣ Install dependencies

```bash
npm install
```

## 3️⃣ Configure environment variables

Create a .env file in the root directory and add:

```ini
NODE_ENV=development
PORT=8000
DATABASE=<your-mongodb-connection-string>
DATABASE_PASSWORD=<your-db-password>
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

EMAIL_USERNAME=<your-email-username>
EMAIL_PASSWORD=<your-email-password>
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587

EMAIL_FROM=<your-from-eamil>

SENDGRID_USERNAME=apikey
SENDGRID_paSSWORD=<your-sendgrid-password>

STRIPE_SECRETKEY=<your-stripe-secret>
```

## 4️⃣ Run the app

```bash
npm start
```

Then visit 👉 http://localhost:8000

## 🧩 API Highlights

| Method     | Endpoint                                    | Description                    |
| ---------- | ------------------------------------------- | ------------------------------ |
| **GET**    | `/api/v1/tours`                             | Get all tours                  |
| **GET**    | `/api/v1/tours/:id`                         | Get a specific tour            |
| **POST**   | `/api/v1/tours`                             | Create new tour (Admin only)   |
| **PATCH**  | `/api/v1/tours/:id`                         | Update tour (Admin only)       |
| **DELETE** | `/api/v1/tours/:id`                         | Delete tour (Admin only)       |
| **POST**   | `/api/v1/users/signup`                      | Register new user              |
| **POST**   | `/api/v1/users/login`                       | Login existing user            |
| **POST**   | `/api/v1/bookings/checkout-session/:tourId` | Create Stripe checkout session |

## 📈 Performance & Optimization

- Reduced API response time by 30–40% through MongoDB indexing and query optimization.

- Applied rate limiting (100 requests/hour) per IP to prevent DDoS attacks.

- Enabled Gzip compression and Helmet for secure and efficient HTTP responses.

# 🧑‍💻 Author

Ahmed Mahmoud
🎓 Computer Science Graduate | 💻 Node.js Backend Developer
📧 ahmed.mahmoud598@hotmail.com

🌐 [LinkedIn](https://www.linkedin.com/in/ahmadmahmoud98) • [GitHub](https://github.com/AhmedMahmoudEG) • [Contact me](mailto:ahmed.mahmoud598@hotmail.com)

# 📜 License

This project is licensed under the MIT License – feel free to use and modify it for learning or development purposes.

**_“Tourista – Explore the world, one booking at a time.”_**
