# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 1 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Medium | Exceeded High | http://host.docker.internal:3000 | Percentage of responses with status code 4xx | 99 % |
| Low | Exceeded High | http://host.docker.internal:3000 | Percentage of slow responses | 59 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of responses with status code 2xx | 1 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with content type application/json | 100 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method DELETE | 3 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method GET | 49 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method PATCH | 12 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method POST | 30 % |
| Info | Informational | http://host.docker.internal:3000 | Percentage of endpoints with method PUT | 3 % |
| Info | Informational | http://host.docker.internal:3000 | Count of total endpoints | 104    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Timestamp Disclosure - Unix | Low | 2 |
| A Client Error response code was returned by the server | Informational | 95 |
| Authentication Request Identified | Informational | 4 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ Timestamp Disclosure - Unix ](https://www.zaproxy.org/docs/alerts/10096/)



##### Low (Low)

### Description

A timestamp was disclosed by the application/web server. - Unix

* URL: http://host.docker.internal:3000/api/usuarios
  * Node Name: `http://host.docker.internal:3000/api/usuarios`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `2035286422`
  * Other Info: `2035286422, which evaluates to: 2034-06-30 13:20:22.`
* URL: http://host.docker.internal:3000/api/usuarios
  * Node Name: `http://host.docker.internal:3000/api/usuarios`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `2041076822`
  * Other Info: `2041076822, which evaluates to: 2034-09-05 13:47:02.`


Instances: 2

### Solution

Manually confirm that the timestamp data is not sensitive, and that the data cannot be aggregated to disclose exploitable patterns.

### Reference


* [ https://cwe.mitre.org/data/definitions/200.html ](https://cwe.mitre.org/data/definitions/200.html)


#### CWE Id: [ 497 ](https://cwe.mitre.org/data/definitions/497.html)


#### WASC Id: 13

#### Source ID: 3

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 403 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:3000/api/bolsillos/10
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10/
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/5657453654729637548
  * Node Name: `http://host.docker.internal:3000/5657453654729637548`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api
  * Node Name: `http://host.docker.internal:3000/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/
  * Node Name: `http://host.docker.internal:3000/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/854055947216793065
  * Node Name: `http://host.docker.internal:3000/api/854055947216793065`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth
  * Node Name: `http://host.docker.internal:3000/api/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/
  * Node Name: `http://host.docker.internal:3000/api/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/5969269729590286660
  * Node Name: `http://host.docker.internal:3000/api/auth/5969269729590286660`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/actuator/health
  * Node Name: `http://host.docker.internal:3000/api/auth/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/1747941144867778317
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/1747941144867778317`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/2096538589991584422
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/2096538589991584422`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/admin
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/admin/
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/admin/5445621365458671399
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/admin/5445621365458671399`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/2285602143168758274
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/2285602143168758274`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/8288109433596852559
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/8288109433596852559`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/10/5808464531725664610
  * Node Name: `http://host.docker.internal:3000/api/cuentas/10/5808464531725664610`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/3676136972155183884
  * Node Name: `http://host.docker.internal:3000/api/cuentas/3676136972155183884`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/mis-cuentas
  * Node Name: `http://host.docker.internal:3000/api/cuentas/mis-cuentas`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/mis-cuentas/
  * Node Name: `http://host.docker.internal:3000/api/cuentas/mis-cuentas/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/estadisticas
  * Node Name: `http://host.docker.internal:3000/api/estadisticas`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/estadisticas/
  * Node Name: `http://host.docker.internal:3000/api/estadisticas/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/estadisticas/456841867968703398
  * Node Name: `http://host.docker.internal:3000/api/estadisticas/456841867968703398`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/seguridad
  * Node Name: `http://host.docker.internal:3000/api/seguridad`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/seguridad/
  * Node Name: `http://host.docker.internal:3000/api/seguridad/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/seguridad/9054131576914755188
  * Node Name: `http://host.docker.internal:3000/api/seguridad/9054131576914755188`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/seguridad/cliente
  * Node Name: `http://host.docker.internal:3000/api/seguridad/cliente`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/seguridad/cliente/
  * Node Name: `http://host.docker.internal:3000/api/seguridad/cliente/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/3871213524340096341
  * Node Name: `http://host.docker.internal:3000/api/transacciones/3871213524340096341`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10/5938170439230832331
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10/5938170439230832331`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/850825997616638076
  * Node Name: `http://host.docker.internal:3000/api/usuarios/850825997616638076`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/cambiar-password
  * Node Name: `http://host.docker.internal:3000/api/auth/cambiar-password ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/cambiar-password/
  * Node Name: `http://host.docker.internal:3000/api/auth/cambiar-password/ ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/estado
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/estado ()({estado})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/estado/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/estado/ ()({estado})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/10/estado
  * Node Name: `http://host.docker.internal:3000/api/cuentas/10/estado ()({estado})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/10/estado/
  * Node Name: `http://host.docker.internal:3000/api/cuentas/10/estado/ ()({estado})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:3000/computeMetadata/v1/ ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/latest/meta-data/
  * Node Name: `http://host.docker.internal:3000/latest/meta-data/ ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/instance
  * Node Name: `http://host.docker.internal:3000/metadata/instance ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/metadata/v1
  * Node Name: `http://host.docker.internal:3000/metadata/v1 ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v1/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v1/instance/ ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/opc/v2/instance/
  * Node Name: `http://host.docker.internal:3000/opc/v2/instance/ ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:3000/openstack/latest/meta_data.json ()({passwordActual,passwordNueva,confirmarPassword})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/ ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar/
  * Node Name: `http://host.docker.internal:3000/api/auth/codigos-recuperacion/regenerar/ ()({passwordActual})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/login/
  * Node Name: `http://host.docker.internal:3000/api/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/admin/10
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/admin/10`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/recuperacion/admin/10/
  * Node Name: `http://host.docker.internal:3000/api/auth/recuperacion/admin/10/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/registro
  * Node Name: `http://host.docker.internal:3000/api/auth/registro ()({nombre,email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/registro/
  * Node Name: `http://host.docker.internal:3000/api/auth/registro/ ()({nombre,email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-con-codigo
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-con-codigo ()({email,codigo,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-con-codigo
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-con-codigo ()({email,codigo,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-con-codigo/
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-con-codigo/ ()({email,codigo,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-password
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-password ()({token,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-password
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-password ()({token,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/restablecer-password/
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-password/ ()({token,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/usuarios
  * Node Name: `http://host.docker.internal:3000/api/auth/usuarios ()({nombre,email,password,rol})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/auth/usuarios/
  * Node Name: `http://host.docker.internal:3000/api/auth/usuarios/ ()({nombre,email,password,rol})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos
  * Node Name: `http://host.docker.internal:3000/api/bolsillos ()({cuentaId,nombre,meta})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/ ()({cuentaId,nombre,meta})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/apartar
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/apartar ()({monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/apartar/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/apartar/ ()({monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/devolver
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/devolver ()({monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/devolver/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/devolver/ ()({monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas
  * Node Name: `http://host.docker.internal:3000/api/cuentas ()({usuarioId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/cuentas/
  * Node Name: `http://host.docker.internal:3000/api/cuentas/ ()({usuarioId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/deposito
  * Node Name: `http://host.docker.internal:3000/api/transacciones/deposito ()({cuentaDestinoId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/deposito/
  * Node Name: `http://host.docker.internal:3000/api/transacciones/deposito/ ()({cuentaDestinoId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/retiro
  * Node Name: `http://host.docker.internal:3000/api/transacciones/retiro ()({cuentaOrigenId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/retiro/
  * Node Name: `http://host.docker.internal:3000/api/transacciones/retiro/ ()({cuentaOrigenId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/transferencia
  * Node Name: `http://host.docker.internal:3000/api/transacciones/transferencia ()({cuentaOrigenId,cuentaDestinoId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/transacciones/transferencia/
  * Node Name: `http://host.docker.internal:3000/api/transacciones/transferencia/ ()({cuentaOrigenId,cuentaDestinoId,monto,descripcion})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios
  * Node Name: `http://host.docker.internal:3000/api/usuarios ()({usuarioAuthId,nombre,documento,email,telefono,estado})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/
  * Node Name: `http://host.docker.internal:3000/api/usuarios/ ()({usuarioAuthId,nombre,documento,email,telefono,estado})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10 ()({nombre,meta})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/bolsillos/10/
  * Node Name: `http://host.docker.internal:3000/api/bolsillos/10/ ()({nombre,meta})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10 ()({usuarioAuthId,nombre,documento,email,telefono,estado})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10/
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10/ ()({usuarioAuthId,nombre,documento,email,telefono,estado})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``


Instances: 95

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (Low)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:3000/api/auth/registro
  * Node Name: `http://host.docker.internal:3000/api/auth/registro ()({nombre,email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`
* URL: http://host.docker.internal:3000/api/auth/restablecer-con-codigo
  * Node Name: `http://host.docker.internal:3000/api/auth/restablecer-con-codigo ()({email,codigo,passwordNueva,confirmarPassword})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `confirmarPassword`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=confirmarPassword`
* URL: http://host.docker.internal:3000/api/auth/usuarios
  * Node Name: `http://host.docker.internal:3000/api/auth/usuarios ()({nombre,email,password,rol})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`
* URL: http://host.docker.internal:3000/api/auth/login
  * Node Name: `http://host.docker.internal:3000/api/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 4

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:3000/api/usuarios/10
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `DELETE `
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios
  * Node Name: `http://host.docker.internal:3000/api/usuarios`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3000/api/usuarios/10/cuentas
  * Node Name: `http://host.docker.internal:3000/api/usuarios/10/cuentas`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:3000/openapi.json
  * Node Name: `http://host.docker.internal:3000/openapi.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


