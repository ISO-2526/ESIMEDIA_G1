backend: 
    mvn -v
    cd esimedia 
    mvn spring-boot:run

frontend: 
        npm install // solo la primera vez o cuando se cambien el package.json o dependencias, modulos...
        SI SWIPER DA ERROR (SLIDER): npm install swiper
        npm start


database: 
    SQL table -> MongoDB collection
    SQL row -> MongoDB document
    SQl column -> Document Field (key/value pair)
    Primary key -> MongoDB _id field
    mongosh   
    exit     


CONTRASEÑA DEL application properties ahora tendrá que estar en un .env en el /esimedia y que contenga MAIL_PASSWORD y la contraseña
