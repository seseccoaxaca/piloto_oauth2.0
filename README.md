## Introducción
El proyecto contiene la implementación del protocolo de autorización OAuth2.0 utilizado por las APIs para comunicarse con la PDN.

Utiliza el grant_type password e implementa el flujo de refresh_token, acorde a las especificaciones emitidas por la PDN, basandose en el uso de JWT para el control y administración de los tokens. 

Este proyecto forma parte de una solución que contempla las APIs del S2 y S3 en ambiente de desarrollo, para reproducirlo completamente, se sugiere el siguiente orden:
* Instalación: preparación del ambiente de desarrollo.
* [Generador](https://github.com/PDNMX/piloto_generador): generador de datos sintéticos para el S2 y S3. 
* [OAuth2.0](https://github.com/PDNMX/piloto_oauth2.0): implementación del protocolo de autorización.
* [API S2](https://github.com/PDNMX/piloto_s2): API para conectarse a la PDN en el Sistema 2. 
* [API S3S](https://github.com/PDNMX/piloto_s3s): API para conectarse a la PDN en el Sistema 3 Servidores sancionados.
* [API S3P](https://github.com/PDNMX/piloto_s3p): API para conectarse a la PDN en el Sistema 3 Particulares Sancionados. 


## Documentación

[Documentación OAuth2.0](https://docs.google.com/document/d/1UoUKII1dscdKojGMEdUyLls0CKPp4pe2E28djCYMf6A/edit?usp=sharing)
[Documentación completa](https://drive.google.com/drive/folders/1aQLhmtKwbWiTy20Ei9k-zy6hneUuYTn2?usp=sharing)
