<p align="center">
  <h1 align="center">PRÁCTICA FINAL DOCKER</h1>
  <h3 align="center">Backend, frontend y base de datos</h3>
</p>

----


---

### CONTENEDORES
  - MONGO
  - MONGO EXPRESS
  - FRONTEND
  - BACKEND


----

### MongoDB

Empezamos creando el archivo ***docker compose*** por la parte de la base de datos.

~~~~yml
mongo-container:
    image: mongo:latest
    container_name: mongo-container
    restart: always
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: quique
      MONGO_INITDB_ROOT_PASSWORD: quique1234
      MONGO_INITDB_DATABASE: cinema
    hostname: mongo-container
    healthcheck:
      test:
        [
          "CMD",
          "mongosh",
          "--quiet",
          "127.0.0.1/mongo-container",
          "--eval",
          "'quit(db.runCommand({ ping: 1 }).ok ? 0 : 2)'",
        ]
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 20s
    volumes:
      - ./mongo/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
      - ./mongo/mongodump.sh:/docker-entrypoint-initdb.d/mongodump.sh:ro
      - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
      - ./mongo/db-dump:/db-dump
    networks:
      - practica_net
~~~~

Para poder iniciar el contenedor y que lo primero que haga sea crear las tablas y las rellene de datos tenemos 3 archivos.
El ***mongo-init.js*** con el que creamos la conexión a la base de datos **'cinema'**, nombre que le hemos dado en el docker compose, creamos un usuario, la colección y los datos a rellenar en ella.

~~~~~javascript
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
~~~~~

Para realizar el dump de la base de datos nada más iniciar la base de datos tenemos el archivo ***mongodump.sh***.

~~~~~sh
mongodump --authenticationDatabase admin --username quique --password quique1234 --db cinema --out /db-dump
~~~~~

Por último, tenemos el script ***mongorestore.sh*** mediante el que restauraremos la base de datos cada vez que se inicie el contenedor en caso de ser necesario. Igual que el anterior script, lo unico que debemos indicar es la base de datos y la colección a restaurar con la flag *--nsInclude*.

~~~~~sh
mongorestore --authenticationDatabase admin --username quique --password quique1234 --nsInclude "cinema.movies" /db-dump

~~~~~

Estos tres archivos los debemos copiar en el directorio ***/docker-entrypoint-initdb.d/*** para que se ejecuten justo al iniciarse el contenedor. Importante también, referenciar el directorio donde se almacenará el dump.

~~~~~sh
    volumes:
      - ./mongo/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
      - ./mongo/mongodump.sh:/docker-entrypoint-initdb.d/mongodump.sh:ro
      - ./mongo/mongorestore.sh:/docker-entrypoint-initdb.d/mongorestore.sh
      - ./mongo/db-dump:/db-dump

~~~~~

Con *healtcheck*, una vez iniciado el servicio de mongo y este funcionando, pasa a crear el resto. Con las variables indicamos que se haga la primera comprobación a los 20s y que cada 10s se vuelva a comprobar en caso de fallo. Realizadas 3 comprobaciones fallidas, se interrumpe la inicialización del docker-compose.

~~~~~sh
    healthcheck:
      test:
        [
          "CMD",
          "mongosh",
          "--quiet",
          "127.0.0.1/mongo-container",
          "--eval",
          "'quit(db.runCommand({ ping: 1 }).ok ? 0 : 2)'",
        ]
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 20s

~~~~~


### Mongo Express


Una vez creado el contenedor para del servicio de **MongoDB**, pasamos a configurar el de **Mongo Express**. 

~~~~~yml
  adminMongo-container:
    image: mongo-express:latest
    container_name: adminMongo-container
    restart: unless-stopped
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: quique
      ME_CONFIG_MONGODB_ADMINPASSWORD: quique1234
      ME_CONFIG_MONGODB_SERVER: mongo-container
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_BASICAUTH_USERNAME: mongoexpress
      ME_CONFIG_BASICAUTH_PASSWORD: mongoexpress
      ME_CONFIG_MONGODB_URL: mongo-container://quique:quique1234@mongo-container:27017/?authSource=admin
    depends_on:
      mongo-container:
        condition: service_healthy
    networks:
      - practica_net
~~~~~

### Backend

Pasamos a la parte de backend. Para ello el contenedor utiliza la imagen *node*.
Copiamos la carpeta local que contiene el proyecto de backend en el directorio de trabajo del contenedor. Una vez iniciado, ejecutamos el comando *npm install* para instalar las dependencias y *npm start* para iniciar el servidor.

~~~~~yml
  backend_container:
    image: node:19-alpine
    container_name: backend_container
    working_dir: /app
    command: sh -c "yarn install && node index.js"
    ports:
    - 5000:3000
    volumes:
      - ./server:/app
    depends_on:
      - mongo-container
      - adminMongo-container
    networks:
      - practica_net
~~~~~

### Frontend

Volvemos a crear el contenedor con la imagen de *node*.
De nuevo, copiamos la carpeta que contiene el proyecto del frontend en el directorio del contenedor e inciamos tanto el instalador de paquetes como el servicio.

~~~~~yml
  frontend_container:
    image: node:19-alpine
    container_name: frontend_container
    working_dir: /app
    command: sh -c "npm install && npm start"
    ports:
     - 8999:8000
    volumes:
      - ./client:/app
    depends_on:
      - backend_container
    networks:
      - practica_net
~~~~~


### Arrancar docker-compose.

Para arrancar podemos usar el comando correspondiente o hacer click derecho sobre el archivo y ***compose up*** y vemos como arrancan todos los contenedores. Primero el de ***MongoDB*** y despues de unos 20s incian el resto.

### Comprobación de todos los servicios.

Coprobamos que todos los contenedores funcionan correctamente.
Primero, el servicio de ***Mongo Express*** vinculado a ***MongoDB*** directamente.
Entrado en la url *localhost:8081*, vemos tanto la bd creada *('cinema')* como la colección *('movies)*

![MongoExpress BD](./imagenes/1.jpg)
![BD y colección](./imagenes/2.jpg)

Ahora el del backend, para ello entramos el localhost:5000.

![Home backend](./imagenes/3.jpg)

Y si visitamos el endpoint de *('/movies)* nos devuelve el json de la base de datos.

![Url /pinturas](./imagenes/4.jpg)

Para el frontend, ingresamos a *localhost:8999* donde esta arrancado.

![Url frontend](./imagenes/5.jpg)

### Puesta en marcha

Como he explicado anteriormente, solo hay que poner en marcha el docker compose mediante comandos o variantes. Destacar que debemos tener el docker desktop en marcha.
Manera 1 de arrancar:
![Arrancar docker compose](./imagenes/6.jpg)
Manera 2 de arrancar:

![Arrancar docker compose](./imagenes/7.jpg)