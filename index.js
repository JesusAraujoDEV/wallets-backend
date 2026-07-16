require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
// CORS configurado con whitelist desde env FRONTEND_URLS (CSV)
// Soporta wildcards: *.dominio.com para permitir cualquier subdominio
const parseCsv = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const normalizeOrigin = (o) => (o ? o.replace(/\/$/, '').toLowerCase() : o);
const FRONTEND_URLS = parseCsv(process.env.FRONTEND_URLS || 'http://localhost:8080');

function isOriginAllowed(origin) {
    const normalized = normalizeOrigin(origin);
    return FRONTEND_URLS.some((pattern) => {
        const normalizedPattern = normalizeOrigin(pattern);
        if (normalizedPattern.includes('*')) {
            const regex = new RegExp('^' + normalizedPattern.replace(/\*/g, '[^.]+') + '$');
            return regex.test(normalized);
        }
        return normalizedPattern === normalized;
    });
}

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir herramientas como Postman/mobile apps (sin origin)
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    // No fijamos allowedHeaders para que el paquete 'cors' refleje Access-Control-Request-Headers automáticamente
    optionsSuccessStatus: 204,
};
app.use(express.json());
app.use(cors(corsOptions));
// Responder preflights para cualquier ruta
app.options('*', cors(corsOptions));
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


const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    sequelize.authenticate()
        .then(() => console.log('Sequelize conectado exitosamente!'))
        .catch((err) => console.error('Error conectando Sequelize:', err.message));
});

module.exports = app;
