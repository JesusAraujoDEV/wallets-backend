require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');
const { sequelize } = require('./src/models');

// Rutas
app.get('/', (req, res) => {
    res.send('<h1>Wallets Backend API</h1><p>El API está funcionando correctamente. Accede a la <a href="/api-docs">documentación de la API</a>.</p>');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

const authRoutes = require('./src/routes/authRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);


// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({ 
        ok: false,
        message: err.message || 'Ocurrió un error interno en el servidor.' 
    });
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    sequelize.authenticate()
        .then(() => console.log('Sequelize conectado exitosamente!'))
        .catch((err) => console.error('Error conectando Sequelize:', err.message));
});

module.exports = app;
