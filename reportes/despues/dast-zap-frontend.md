# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 3    |
| Info | Informational |  | Percentage of network failures | 2 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of responses with status code 2xx | 96 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of responses with status code 3xx | 3 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with content type font/woff2 | 20 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with content type image/svg+xml | 10 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with content type text/css | 10 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with content type text/html | 50 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with content type text/javascript | 10 % |
| Info | Informational | http://host.docker.internal:4173 | Percentage of endpoints with method GET | 100 % |
| Info | Informational | http://host.docker.internal:4173 | Count of total endpoints | 10    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Information Disclosure - Suspicious Comments | Informational | 1 |
| Modern Web Application | Informational | Systemic |
| Storable but Non-Cacheable Content | Informational | Systemic |




## Alert Detail



### [ Information Disclosure - Suspicious Comments ](https://www.zaproxy.org/docs/alerts/10027/)



##### Informational (Medium)

### Description

The response appears to contain suspicious comments which may help an attacker.

* URL: http://host.docker.internal:4173/assets/index-D6onp9WV.js
  * Node Name: `http://host.docker.internal:4173/assets/index-D6onp9WV.js`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `i/auth/recuperacion/admin/${e}`,{metodo:`POST`
  * Other Info: `The following pattern was used: \bADMIN\b and was detected in likely comment: "//,``).split(`/`);p=`/`+f.replace(/^\//,``).split(`/`).slice(e.length).join(`/`)}let m=n&&n.state.matches.length?n.state.matches", see evidence field for the suspicious comment/snippet.`


Instances: 1

### Solution

Remove all comments that return information that may help an attacker and fix any underlying problems they refer to.

### Reference



#### CWE Id: [ 615 ](https://cwe.mitre.org/data/definitions/615.html)


#### WASC Id: 13

#### Source ID: 3

### [ Modern Web Application ](https://www.zaproxy.org/docs/alerts/10109/)



##### Informational (Medium)

### Description

The application appears to be a modern web application. If you need to explore it automatically then the Client Spider may well be more effective than the standard one.

* URL: http://host.docker.internal:4173
  * Node Name: `http://host.docker.internal:4173`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script type="module" crossorigin src="/assets/index-D6onp9WV.js"></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`
* URL: http://host.docker.internal:4173/
  * Node Name: `http://host.docker.internal:4173/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script type="module" crossorigin src="/assets/index-D6onp9WV.js"></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`
* URL: http://host.docker.internal:4173/acceso
  * Node Name: `http://host.docker.internal:4173/acceso`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `<script type="module" crossorigin src="/assets/index-D6onp9WV.js"></script>`
  * Other Info: `No links have been found while there are scripts, which is an indication that this is a modern web application.`

Instances: Systemic


### Solution

This is an informational alert and so no changes are required.

### Reference




#### Source ID: 3

### [ Storable but Non-Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, but will not be retrieved directly from the cache, without validating the request upstream, in response to similar requests from other users.

* URL: http://host.docker.internal:4173
  * Node Name: `http://host.docker.internal:4173`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-cache`
  * Other Info: ``
* URL: http://host.docker.internal:4173/assets/index-DpjEUra2.css
  * Node Name: `http://host.docker.internal:4173/assets/index-DpjEUra2.css`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-cache`
  * Other Info: ``
* URL: http://host.docker.internal:4173/robots.txt
  * Node Name: `http://host.docker.internal:4173/robots.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-cache`
  * Other Info: ``
* URL: http://host.docker.internal:4173/sitemap.xml
  * Node Name: `http://host.docker.internal:4173/sitemap.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `no-cache`
  * Other Info: ``

Instances: Systemic


### Solution



### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


