//Requires
const express = require('express');
const axios = require('axios');
const $ = require('cheerio'); //Librería para la imprementación rápida de jQuery (https://github.com/cheeriojs/cheerio)


//App
const PORT = 3000;
const app = express();


//Middleware
app.use(express.static(__dirname + '/public')); //Archivos estáticos
app.set('views', __dirname + '/public/views'); //Views

app.engine('html', require('ejs').renderFile); //Renderizar los html mediante 'ejs' (librería)
app.set('view engine', 'html'); //Motor de la vista


//Rutas
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/find', (req, res) => {

    findEndpoint(); //Explicación en el apartado "FUNCIONES"
    res.render('find');
});

app.get('/find/:category', (req, res) => {
    let category = req.params.category.toUpperCase(); //Categoría

    if (!category) { //Si no trae categoría, se le muestran todas    

        findEndpoint(); //Explicación en el apartado "FUNCIONES"

    } else { //Si trae categoría, se busca en al App Store
        let url = `https://play.google.com/store/apps/category/${category}`;
        let appLinks = [];
        let appObjects = [];

        findResults(url, appLinks, appObjects);

        setTimeout(() =>{        
            console.log(appObjects);
        }, 8000)
    }
    
    res.render('find');
});

app.get('/users', (req, res) => {
    //Obtener parámetros de la URL
    let page = req.query.page || '1';
    let limit = req.query.limit || '20';

    //Saber si el parámetro limit es múltiplo de 20
    if(limit % 20 !== 0 ){
        limit = Math.round(limit/20.0) * 20;       
    }

    axios.get(`https://gorest.co.in/public-api/users?page=${page}&limit=${limit}`)
    .then(res => {
        console.log(res['data']); //Añadir "['data']" si solo se quiere que salga el array de objetos
    })
    .catch(error => {
        console.log(error);
    });

    res.render('users');
});

app.get('/users/:id', (req, res) => {
    let id = req.params.id; //Id del user
    if (!id) { //Si no trae id, se le muestran todos los users        
        axios.get('https://gorest.co.in/public-api/users')
        .then(res => {
            console.log(res['data']);
        })
        .catch(error => {
            console.log(error);
        });
    } else { //Si trae id, se busca al user
        axios.get(`https://gorest.co.in/public-api/users/${id}`)
        .then(resUser => {
            resUser = resUser['data']; //Transformamos redUser en su data, para mejor comprensión

            if(resUser['code'] == 404){ //Si no se encuentra el id, mensaje de que no se encuentra.
                console.log(`El usuario con id ${id} no ha sido encontrado, pruebe con otro id.`);
            } else { //Si se encuentra, buscamos los post de ese id
                axios.get(`https://gorest.co.in/public-api/posts?user_id=${id}`)
                .then(resPost => { 
                    resPost = resPost['data']; //Transformamos redUser en su data, para mejor comprensión
                    if(resPost['data'] == []){ //Si no hay posts, se pone un array vacío
                        resUser['post'] = [];
                    } else { //Si hay posts, se rellena con los datos
                        resUser['post'] = resPost['data'];
                        console.log(resUser);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
            }
        })
        .catch(error => {
            console.log(error);
        });
    }

    res.render('users');
});


//Listener
app.listen(PORT, () => {
    console.log('Server en el puerto 3000 corriendo perfectamente');
});


// -----------FUNCIONES----------- //

//Función para obtener los datos del endpoint "/find"
//He creado una función porque se repite en dos sitios diferentes
let findEndpoint = () => {
    const url = 'https://play.google.com/store/apps';
    let appLinks = [];
    let appObjects = [];

    findResults(url, appLinks, appObjects);

    //Muestra de los resultados
    setTimeout(() =>{        
        console.log(appObjects);
    }, 8000)
}



//Función para obtener los datos de las 5 primeras aplicaciones
//Parámetros: url -> string, appLinks -> [], appObjects -> []
let findResults = (url, appLinks, appObjects) => {
    axios.get(url) //Obtener datos de la página principal  
    .then(html => {

        let appsHtml = $('.b8cIId.ReQCgd.Q9MA7b', html['data']);

        Object.keys(appsHtml).forEach((key, i) => {
            if(i < 5){
                let hrefApp = appsHtml[key]['children'][0]['children'][0]['parent']['attribs']['href'];
                let appLink = `https://play.google.com${hrefApp}`;

                appLinks.push(appLink);
            }      
        });
        
        appLinks.forEach((appLink, i) => {
            axios.get(appLink) //Segunda petición para obtener los datos del perfil de la aplicación elegida
                .then(htmlApp => {
                    //Obtención del nombre, número de descargas y descripción de los 5 primeros objetos
                    const name = $('.AHFaub', htmlApp['data'])[0]['children'][0]['children'][0]['data'];
                    const downloads = $('.AYi5wd.TBRnV', htmlApp['data'])[0]['children'][0]['children'][0]['data'];
                    const description = $('.W4P4ne', htmlApp['data'])[0]['children'][1]['attribs']['content'];

                    appObjects.push(
                        {
                            'name': `${name}`,
                            'description': `${description}`,
                            'downloads': `${downloads}`
                        }
                    );    
                })
                .catch(error => {
                    console.log(error);
                }); 
        });
    })
    .catch(error => {
        console.log(error);
    });

}