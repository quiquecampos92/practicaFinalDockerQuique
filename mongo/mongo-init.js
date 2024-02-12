// Conexión a la base de datos
var conn = new Mongo();
var db = conn.getDB('cinema');

db.createUser(
    {
        user: "campos",
        pwd: "campos1234",
        roles: [
            {
                role: "readWrite",
                db: "cinema"
            }
        ]
    }
);

// Crear la colección
db.createCollection('movies');

// Documentos a insertar
var movies = [
    {
        "name": "Inception",
        "time": ["14:30", "18:15", "21:00"],
        "rating": 9
    },
    {
        "name": "The Shawshank Redemption",
        "time": ["13:45", "17:20", "20:10"],
        "rating": 10
    },
    {
        "name": "Pulp Fiction",
        "time": ["15:00", "19:45", "22:30"],
        "rating": 8
    },
    {
        "name": "The Dark Knight",
        "time": ["14:15", "18:40",],
        "rating": 8
    }
];

// Insertar documentos en la colección
db.movies.insertMany(movies);

print('Colección "movies" creada y documentos insertados exitosamente.');
