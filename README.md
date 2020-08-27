## Pre - requisitos

Versión estable SLP (soporte de largo-plazo) de NodeJs y NPM previamente instalados, si no se cuenta con ellos puede descargarlos del siguiente enlace [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

Ambiente con la base de datos MongoDB instalado y configurado. Se asume que el usuario conoce ya las credenciales asignadas a la base de datos, esta información es indispensable. Para más información, vea el reporte de instalación, [Ref.[1]](https://docs.google.com/document/d/1RQQssZpUOH6d5103QMPkY6v2wakRvQk0yLqobm1AzB8/edit#bookmark=id.x8piaddu7vbs).

Se recomienda haber leído este documento en su totalidad antes de replicar el generador de datos de manera local.


## Ejecución del programa

- El servicio del servidor de autorización OAuth 2.0 deberá descargarlo del repositorio de Github de la PDN del siguiente link, siguiendo las instrucciones que ahí se especifican.

[https://github.com/PDNMX/piloto\_oauth2.0](https://github.com/PDNMX/piloto_oauth2.0)

- Para clonar el repositorio desde el CLI de su computador utilice el siguiente comando:

| $ git clone https://github.com/PDNMX/piloto\_oauth2.0.git |
| --- |

- Se le solicitará su usuario y contraseña de Github para acceder.

- Agregaremos un nuevo servicio al archivo docker-compose.yml en la carpeta designada para mongodb de la siguiente forma…

```sh
..
 oauth20:
    restart: always
    container_name: oauth20
    build:
      context: ../piloto_oauth2.0/
      dockerfile: Dockerfile
    ports:
      - 9003:9003    
    links:
      - mongodb
    depends_on:
      - mongodb
..
```

En la variable context se especifica la ubicación donde fue descargada la aplicación y que también contiene el archivo Dockerfile incluido en la descarga de github, para este caso ../piloto\_oauth2.0/

El puerto incluye el mapeo del puerto en el host con el puerto interno en el contenedor   &#60;host&#62;:&#60;contenedor&#62;, el puerto interno deberá coincidir con el puerto especificado dentro del código de nodejs, en este caso usaremos 9003.


## Variables de entorno

El archivo donde se contemplan las variables de entorno estará localizado en la siguiente ruta /config/config.env

Este archivo desde el repositorio viene vacío hay que colocar el nombre de los parámetros mencionados en esta sección junto con su valor correspondiente para el correcto funcionamiento de la aplicación.

El nombre de la base de datos, parámetros de configuración y los nombres de las colecciones son configurables desde el archivo config.env_ **,** _ localizado en la carpeta config del proyecto.

A continuación listamos las variables y su uso

**USERMONGO** : Usuario para acceder a la base de datos (verificar que el usuario tenga los privilegios correspondientes )

**PASSWORDMONGO** : Password para acceder a la base de datos

**HOSTMONGO:** Dirección ip donde se encuentra alojada la base de datos

**DATABASE** : Nombre de la base de datos

**PORTSERVER** : Puerto en el que correrá la aplicación

Las variables de entorno que hacen referencia a nuestros tokens

**EXT** : Expiración del token en segundos

**RTEXT** : Expiración del refresh token en segundos

**SEED** : Semilla para la codificación del JWT

Cabe mencionar que el **refresh token** es un String aleatorio no un JWT, ya que el refresh token se valida en el servidor de autenticación. Por lo tanto, podemos obtenerlo haciendo una petición a la base de datos y verificando los parámetros para generar un nuevo token.


## Desplegar Contenedor

- Una vez hecho todo lo anterior, procedemos correr el docker compose desde la carpeta de mongoDB que contiene el archivo docker-compose.yml de la siguiente forma

| $ docker-compose up -d |
| --- |

En caso que mongoDB ya esté corriendo en un contenedor, sólo construirá la nueva imagen y se creará el nuevo contenedor para oauth20

- Una vez terminado el proceso verificaremos que todos los contenedores dentro del archivo docker-compose.yml estén corriendo con el comando

| $ docker-compose ps|
| --- |

         Name                        Command               State            Ports          
-------------------------------------------------------------------------------------------
mongodb_mongo-express_1&ensp;&ensp;   tini -- /docker-entrypoint ...&ensp;   Up&ensp;      0.0.0.0:8081->8081/tcp  
mongodb_mongo_1&ensp;&ensp;           docker-entrypoint.sh -f /e ...&ensp;   Up&ensp;      0.0.0.0:27017->27017/tcp<br>
mongodb_oauth20_1&ensp; &ensp;        docker-entrypoint.sh yarn  ...&ensp;   Up&ensp;      0.0.0.0:9003->9003/tcp  
mongodb_s2_1&ensp;&ensp;              docker-entrypoint.sh yarn  ...&ensp;   Up&ensp;      0.0.0.0:8080->8080/tcp  
mongodb_s3a_1&ensp;&ensp;             docker-entrypoint.sh yarn  ...&ensp;   Up&ensp;      0.0.0.0:8082->8080/tcp  
mongodb_s3b_1 &ensp;&ensp;            docker-entrypoint.sh yarn  ...&ensp;   Up &ensp;     0.0.0.0:8083->8080/tcp 


## Esquemas en la base de datos

Dentro de MongoDb tendremos una base de datos específica para las colecciones que conciernen a la implementación oauth2.0

Usuarios

Nombre de la colección: **users**

| **Nombre del campo** | **Tipo** | **Valor posible** | **Descripción** |
| --- | --- | --- | --- |
| username | String | &#39;ecamargo&#39; | Nombre del usuario o identificador |
| password | String | &#39;123456&#39; | Contraseña del usuario |
| scope | Array String | [&#39;readWrite&#39; , &#39;read&#39;] | Privilegios a los cuales se asocia este usuario |

Clientes

Nombre de la colección: **clients**

| **Nombre del campo** | **Tipo** | **Valor posible** | **Descripción** |
| --- | --- | --- | --- |
| clientId | String | &#39;txm.global&#39; | Identificador del cliente |
| clientSecret | String | &#39;pass&#39; | Contraseña del cliente |
| grants | Array String | [&#39;admin&#39;] | Privilegios asociados con el cliente |

**Nota:** En caso de que el valor clientSecret no se agregue al documento, porque no existe en el ambiente, la solicitud post no deberá contener dicho parámetro o se puede colocar en el documento con un valor vacío, es decir, dos comillas simples &#39;&#39;

Tokens

Nombre de la colección: **tokens**

| **Nombre del campo** | **Tipo** | **Valor posible** | **Descripción** |
| --- | --- | --- | --- |
| access\_token | String | &#39;eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVjYW1hcmdvIiwianRpIjoiR1VoQ1dNR0siLCJzY29wZSI6IndyaXRlICIsImlhdCI6MTU5NTMwNDAwMiwiZXhwIjoxNTk1MzA0MDYyfQ.n5JLQo0fl7l0LbJ\_anPfsA3O2r-EMlGmvK0fJ-LP2Zg&#39; | Token en formato JWT el cual permite la validación de identidad en el recurso protegido |
| expires\_in | Number | 300 | Tiempo de expiración del access\_token en segundos |
| refresh_token | String | OztWyf5YGjPJxrkkx4feeRGT3eup21yRMZgfMuNLrwBKvsIcKT3u6PvyjGlfc951nLhr0tNOZT4UezG971FXUNBaUNDaWNO6h8Uzno62wJA5K3iRF9smW4IdgmXMpkr4fB0C5KfQmsjNZL02bTzrQBmJ4BEOTmRjseAkr0A3JQU3vFtIyyXHQWxVaW03tNDgu001feEgQ15XilnmWq9zubngnnLLoZrN6bah3UhGxSwFgydgzR9W19CpxDdryrsE | Token (random string) el cual se utiliza para generar un nuevo token (flujo refresh token) |
| refresh\_token\_expires\_in | Number | 600 | Tiempo de expiración del refresh token en segundos |
| refresh\_token\_expires\_in\_date | Number | 1595275826 | unix timestamp de la expiracion del refresh token |
| client | Object | {clientId: &#39;pdn.resource.1&#39;} | Se almacena solo el id del cliente |
| user | Object | {username: &#39;ecamargo&#39;} | Se almacena el username |


## Cargar datos en mongodb

Para efecto práctico se tienen que cargar los siguientes documentos en la base de datos para seguir los ejemplos lo haremos por medio de mongo cli

1.- Entramos a la base de datos con el siguiente comando

| $ mongo -u root -p --host &#60;IP_HOST&#62;|
| --- |

El parámetro  &#60;IP_HOST&#62; se sustituye por la ip del servidor.

2.- Seleccionamos la base de datos perteneciente ya dentro del prompt de mongo

| use oauth20 |
| --- |

3.- Insertamos los documentos con el siguiente comando

```json
db.users.insert([
{
    username: 'ecamargo',
    password: '123456',
    scope: ['read','readWrite']
}
])

db.clients.insert([{
    clientId: 'txm.global',
    clientSecret: 'pass',
    grants: []
}
])

```


## Obtención del token

Para poder generar un nuevo token se requiere mandar una solicitud de tipo POST a la ruta /oauth/token

Los parámetros se describen en el documento &quot;Guía de referencia protocolo de autorización&quot;, a continuación se describen algunas consideraciones.

- Los parámetros que se pueden mandar en el encabezado son el client\_id y el client\_secret ([Ejemplo 1 del comando curl](#9v6gl8o69c91) ). Estos tendrán que ir codificados en formato base 64 y anteponer la palabra **Basic** ya que la autenticación es de ese estilo y se obtiene el siguiente formato

| Basic &#60;base64(client\_id:client\_secret)&#62; |
| --- |

En el siguiente enlace, se puede generar el formato y obtener el siguiente resultado [https://www.blitter.se/utils/basic-authentication-header-generator/](https://www.blitter.se/utils/basic-authentication-header-generator/)

Ejemplo:

| Basic dHhtLmdsb2JhbDpob2xh |
| --- |

También se pueden pasar esos dos parámetros dentro del body de la solicitud POST ([Ejemplo 2 del comando curl](#sejfgaoeeleg))

El campo client\_secret por ser opcional puede ir o no dentro de cualquiera de las dos opciones proporcionadas anteriormente. Dentro de la base de datos el documento del cliente no deberá de contener el campo client\_secret en caso de que no esté definido u otra posibilidad sería colocar el campo con un valor vacío

Ejemplos :

```json
{
    clientId: 'txm.global',
    grants: []
}

{
    clientId: 'txm.global',
    clientSecret: "",
    grants: []
}
```

Al momento de generar la solicitud por curl hay que tener en cuenta que si existe el campo con un valor vacío o simplemente no existe el campo se puede pasar un valor vacío o simplemente omitir el paso del campo

Ejemplo de campo vacío:

| --data-urlencode &#39;client\_secret=&#39; |
| --- |

- El Content-Type tiene que ser application/x-www-form-urlencodedpara poder mandar los parámetros y obtener respuesta esperada.

Ejemplo 1 del comando curl enviando las credenciales del cliente por el encabezado

Valores :

client\_id = txm.global

client\_secret = pass

Codificado en base 64 = dHhtLmdsb2JhbDpwYXNz

```sh
curl --location --request POST '<IP_HOST>:9003/oauth/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Basic dHhtLmdsb2JhbDpwYXNz' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'username=ecamargo' \
--data-urlencode 'password=123456' \
--data-urlencode 'scope=read writeSuper'
```

Ejemplo 2 del comando curl enviando las credenciales del cliente por medio del body

```sh
curl --location --request POST 'http://127.0.0.1:9003/oauth/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=txm.global' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'username=ecamargo' \
--data-urlencode 'password=123456' \
--data-urlencode 'scope=read' \
--data-urlencode 'client_secret=pass'
```

## Scopes

Los scopes son privilegios que se relacionan directamente al usuario para restringir el nivel de acceso a los recursos protegidos (API).

Cuando se envía la solicitud POST, se pueden enviar los scopes solicitados por medio del parámetro **scope,** estos se validan en el servidor de autenticación y retornan solo en caso de estar asociados al usuario. En caso de enviar en la petición un scope inválido para el usuario u omitir el scope para un usuario que tiene scopes asociados, se retornará un mensaje de error.

Debido a que los scopes son opcionales, o sea, no están definidos; esto queda fuera del alcance de la implementación OAUTH2. Se recomienda generar una colección con ellos y generar un método de asociación hacia los usuarios.

## Respuesta de la solicitud
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImVjYW1hcmdvIiwianRpIjoiYjdjOFBEZkYiLCJzY29wZSI6InJlYWQgIiwiaWF0IjoxNTk2MDU3ODI2LCJleHAiOjE1OTYwNTgxMjZ9.Zoe3oJwjsuM_0r2Z72fyZnaWqO0yNLZ06jm3yReDzqE",
    "token_type": "bearer",
    "expires_in": 300,
    "refresh_token": "D2MeNrnDRnMBsLdV6LQkoDow7Y5Mt8eLgaM76FR3BNVbz6TdtXWXhvB6wLaRR5jVaj2oCkNLge4ODw1TYSnop7dHJ4zRGgK0iE6CrlcXsrN97XVkYg8Kr75bWKSBfAm3q4CoRPr31XB3XyV1agFTSdAbYQ6XutVxEsGytZg7ljDBeO0bKicVkSF7qMTlFWilHtuG7mKCcRJd1y5dROhXI15TvemNlB5eD6LVyyyE3qmKf1Vx9nG8MYZb4tSV8Ky5",
    "refresh_token_expires_in": 600,
    "scope": "read "
}
```

Los parámetros se describen en el documento &quot;Guía de referencia protocolo de autorización&quot;, [Ref. [1]](#wrpdaigw2fq6), a continuación se describen algunas consideraciones.

El parámetroaccess\_token es un JWT. Para mayor información, consulte el enlace [https://openwebinars.net/blog/que-es-json-web-token-y-como-funciona/](https://openwebinars.net/blog/que-es-json-web-token-y-como-funciona/)

Los JWT se generan con base en una semilla que es una cadena de texto la cual se usa para codificar el JWT y con esa semilla es posible validarlo en el servidor de recursos protegidos, es decir, en el API.

 De esta manera evitamos el uso de la base de datos para conceder el acceso a los recursos

El JWT generado almacena los siguientes parámetros en el payload, los cuales sirven para verificar si el token ha expirado (iat, exp), si el token tiene el privilegio para usar el recurso (scope) o si necesitamos ver quien genera la operación (username):

iat : tiempo de creación del token

exp: tiempo de expiración del token

scope: privilegios solicitados del usuario

username: nombre del usuario

jti: hace único al JWT (para evitar duplicados )


# Transferencia de conocimiento


## Tecnologías utilizadas

- NodeJS v12.18.2
- MongoDB 4.2.8

Se requiere que los documentos de clientes y usuarios estén previamente generados. Se puede acceder a la base de datos y generar el documento, la estructura ya se encuentra disponible en la sección[2.3 Esquemas en la base de datos](#_dsldk0afh95n)

El archivo que contiene la lógica del servidor es AuthorizationServer.js. De este archivo se listan las funcionalidades y se desglosa cada punto en las secciones posteriores.

Para poder acceder a la base de datos se tiene el siguiente fragmento de código:

```javascript
//connection mongo db
const db = mongoose.connect('mongodb://'+process.env.USERMONGO+':'+process.env.PASSWORDMONGO+'@'+process.env.HOSTMONGO+'/'+process.env.DATABASE, { useNewUrlParser: true,  useUnifiedTopology: true  })
   .then(() => console.log('Connect to MongoDB..'))
   .catch(err => console.error('Could not connect to MongoDB..', err))
```

## Funciones utilizadas

La función createToken genera el token que se ingresara a la base de datos. Como parámetros de entrada tenemos el clientId , username y los scopes, los cuales se obtienen de solicitudes hacia la base de datos previamente a la llamada de la función.

```javascript

function createToken(clientId,username, scope){
   let expiresin = Number(process.env.EXT); //se obtienen los segundos de vida del token

   let access_token = jwt.sign({
       username: username,
       jti: randomstring.generate(8),
       scope : scope
   },process.env.SEED,{expiresIn : expiresin }); //se genera el JWT y se se agregan a su payload algunos atributos que consideramos se utilizaran en el API

   var tokenResponse = {
       access_token: access_token,
       token_type: 'bearer',
       expires_in: expiresin, //value in seconds
       refresh_token: randtoken.uid(256),
       refresh_token_expires_in: Number(process.env.RTEXT) , //value in seconds
       refresh_token_expires_in_date: Math.floor(Date.now() / 1000) + Number(process.env.RTEXT) ,
       scope: scope,
       client: {clientId: clientId},
       user: {username : username}
   }
   return tokenResponse;
}

```

En el código, se obtiene la expiración del token y posteriormente, se genera el JWT. Aquí se observa que solicitamos variables de entorno relacionadas con el token como el **SEED** ylos tiempos de expiración.

Una vez creado el JWT se agrega como valor al campo access\_token,se llenan los demás campos con los parámetros en entrada de la función y otros se generan en tiempo de ejecución, como lo es el refresh_token que es un random String. Para esto último, se usa la librería rand-token para generar el token y retornar el objeto.

Para mayor información de la librería rand-token, consulte el siguiente enlace: [https://www.npmjs.com/package/rand-token](https://www.npmjs.com/package/rand-token)

La función decodeClientCredentials toma el objeto _&quot;req&quot;,_ que es la solicitud que llega de algún ente externo al servidor, y busca si los parámetros client\_id y client\_secret se enviaron dentro del header de la solicitud o si se enviaron como parámetros del body. Se extraen de cualquiera de los dos casos y se devuelven.
 Como el client\_secret es opcional, se inicializa como un string vacío el cual más adelante se usará para validar si existe o no un valor en client\_secret en la base de datos.

```javascript
let decodeClientCredentials = function(req) {

    let clientId;
    let clientSecret ='';

    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        //check the body
        if(req.body.client_id){
            clientId = req.body.client_id;
            if(req.body.client_secret){
                clientSecret = req.body.client_secret;
            }
        }
    }else{
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        [clientId, clientSecret] = credentials.split(':');
    }

    return { id: clientId, secret: clientSecret };
};
```
## Servicios MongoDB

Las funciones dentro de los &quot;servicios&quot; son de tipo async, esto porque los métodos que provee mongoose retornan un promise_._ Por lo tanto, cuando se invoquen las funciones de los servicios se tiene que anteponer la palabra **await**.

Al final de los archivos de servicios se exportan las funciones para ser reconocidas a la hora de importarlos en el archivo principal.

También se exportan los servicios que son los que realizan las peticiones a la base de datos :

```javascript
var userService= require("./mongo/service/mongoUser");
var clientService = require("./mongo/service/mongoClient");
var tokenService = require("./mongo/service/mongoToken");
```

Los servicios correspondientes a mongodb están en la carpeta piloto\_oauth2.0/mongo/service, cada uno de ellos se describe en las siguientes secciones.


### mongoUser

Dentro del archivo mongoUser se tienen las siguientes funciones:

- getUser(username, password). Este método devuelve el usuario correspondiente al username y el password recibidos en el método, en caso de que existan en la base de datos

- getUserByUsername(username).Este método devuelve el usuario correspondiente al username


### mongoClient

Dentro del archivo mongoClient se tienen las siguientes funciones:

- getClient (clientId)retorna el cliente correspondiente al parametro clientId pasado en la función

```javascript
var clientModel = require('./mongo/model/client');

async function getClient (clientId){
   let client = await clientModel.findOne({clientId: clientId}).exec();
   return client;
}
module.exports.getClient = getClient;
```

### mongoToken

Por último, se tiene el archivo mongoToken donde se tienen las siguientes funciones:

- getTokenByRefresh (refresh\_token). Permite obtener el documento token por el campo refresh\_token, esto es usado en el flujo refresh token para la validación de los campos.

- removeTokenByRefresh (refresh\_token). Este método remueve el token dado el refresh\_token. Esta función se usa ya que se ha generado el nuevo token por el flujo refresh token. Se elimina la entidad ya que no debería ser funcional en ese punto del flujo


## Modelos y Esquemas

En la ruta piloto\_oauth2.0/mongo se encuentran los modelos y los esquemas generados con mongoose.

Los esquemas o &quot;schemas&quot; son la definición de la entidad, es decir, del documento. Dentro de cada schema se definen los campos y el tipo de dato de cada uno.

El modelo o &quot;model&quot; se genera con base al schema, y nos permite generar operaciones CRUD hacia la base de datos.

```javascript
var mongoose = require(‘mongoose’),
    modelName = ‘client’,
    schemaDefinition = require(‘../schema/’ + modelName),
    schemaInstance = mongoose.Schema(schemaDefinition),
    modelInstance = mongoose.model(modelName, schemaInstance);
module.exports = modelInstance;
```

En código anterior (/schema/client.js), el campo modelName es el nombre de la base de datos dentro de MongoDB, de acuerdo a la documentación de mongoose, para la creación del modelo el nombre debe ser singular y en la base de datos tiene que ser plural (clients).

## Lógica principal

La lógica principal se encuentra en la solicitud tipo post/oauth/token.Dentro de esta función se realizan las validaciones para la obtención del token, ya sea grant type password o refresh token. El orden de las validaciones es el siguiente:

**Método Grant type password**

1. Se obtienen los datos del cliente y se comprueban
2. Se obtiene el grant type enviado en el body de la solicitud y se comprueba que sea de tipo password
3. Se obtienen el username y el password del body de la solicitud, con estos datos se solicita a la base de datos el documento de ese usuario asociado a esos campos
4. En caso de que el usuario exista, se obtienen los scopes enviados en el body de la solicitud
5. Se validan los scopes asociados al usuario
6. Se genera el token
7. El token se almacena en la base de datos
8. Se retorna la respuesta en el formato descrito en el documento _&quot;__Guía de referencia protocolo de autorización&quot;_

**Método Grant type refresh token**

1. Se obtienen los datos del cliente y se comprueban
2. Se obtiene el grant type enviado en el _body_ de la solicitud y se comprueba que sea de tipo _refresh\_token_
3. Se obtiene el token por medio del refresh token
4. Se valida que sea el mismo cliente el que manda la solicitud al que está asociado el token
5. Se valida la expiración del refresh token
6. Se obtienen el usuario por medio de la información asociada al token
7. En caso de que el usuario exista, se obtienen los scopes enviados en el _body_ de la solicitud
8. Se validan los scopes asociados al usuario
9. Se genera el token
10. El token se almacena en la base de datos
11. Se elimina el token asociado al refresh token
12. Se retorna la respuesta en el formato descrito en el documento _&quot;__Guía de referencia protocolo de autorización&quot;_, Ref.[1].
## Respuestas de error y causas

| **Mensaje de error** | **Status del error** | **causa** |
| --- | --- | --- |
| Credenciales del cliente incorrectas | 401 | Los parámetros del cliente no son correctos |
| Error en la contraseña del cliente | 401 | El client\_secret es incorrecto |
| Grant type no soportado | 401 | El grant type es incorrecto |
| El refresh token es invalido, revisar sintaxis | 401 | El refresh token mandado no se encuentra en la bd |
| El refresh token falta en la solicitud, verificar campo | 422 | No se mando el parámetro refresh\_token en el body de la solicitud |
| Clientid invalido, revise el campo | 401 | El clientId enviado en la solicitud es diferente al que se tiene asociado al token |
| El refresh token ha expirado | 401 | El refresh token expiró |
| Error en las credenciales del usuario, verificar los datos | 401 | Credenciales inválidas por parte del usuario |
| No se enviaron correctamente los parámetros del usuario | 422 | Faltan campos del usuario proporcionados en la solicitud |
| Parámetros de cliente enviados incorrectamente | 401 | Falta el client id en la solicitud post |
| Scope no proporcionado | 422 | Falta el parámetro scope y el usuario si tiene scopes asociados |
| Scope no válido | 422 | Los scopes que se manda son inválidos |


# Glosario

El glosario general se incluye en el anexo Guía de ayuda, [Ref.[4]](#xdfe451pw6sm).


# Referencias

| **Ref.** | **Nombre del documento** | **Número del documento** |
| --- | --- | --- |
| 1 | [Guía de referencia protocolo de autorización](https://drive.google.com/file/d/17-npQleAV87gV19hbmtzgZipegl0qrIO/view) | - |
| 2 | [Reporte de instalación](https://docs.google.com/document/d/1T31p7_n89bOMkW9ZC_G0ZGoldc_XyB_fWuMZ7u9Qlvo/edit?usp=sharing)[GOV UK\_IIR\_Interconnection of S2 and S3 of the PDN](https://docs.google.com/document/d/1T31p7_n89bOMkW9ZC_G0ZGoldc_XyB_fWuMZ7u9Qlvo/edit?usp=sharing) | TXMG-00848 |
| 3 | [Generador de Datos Sintéticos](https://docs.google.com/document/d/1RQQssZpUOH6d5103QMPkY6v2wakRvQk0yLqobm1AzB8/edit?usp=sharing)[GOV UK\_Gen\_Interconnection of S2 and S3 to the PDN](https://docs.google.com/document/d/1RQQssZpUOH6d5103QMPkY6v2wakRvQk0yLqobm1AzB8/edit?usp=sharing) | TXMG-00850 |
| 4 | [Guía de ayuda](https://docs.google.com/document/d/1qbxdN9IKSrzdO57NoIgWctBiBNZo4r1-PwfW2Ac2YWc/edit?usp=sharing)[GOV UK\_Anexo\_Interconnection of S2 and S3 of the PDN](https://docs.google.com/document/d/1qbxdN9IKSrzdO57NoIgWctBiBNZo4r1-PwfW2Ac2YWc/edit?usp=sharing) | TXMG-00853 |