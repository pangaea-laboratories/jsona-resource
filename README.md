# jsona-resource
Consume jsonapi with Jsona

`jsona-resource` helps consuming [JSON:API](http://jsonapi.org/) web service with no coniguration and uses [Jsona](https://github.com/olosegres/jsona) to serialize and deserialize the data.

## Installation

```
# npm install --save https://github.com/pangaea-laboratories/jsona-resource
```

## Setup

To create a resource corresponding to a resource on the server:

```javascript
import axios from '@/utils/axios'
import { JsonApiResource } from '@/jsonapi'

const httpService = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/vnd.api+json',
    },
});

const params = {
    include: 'country'
}

const resource = JsonApiResource('orders', httpService)

resource.fetchTown(123, { params }).then((town) => {
    console.log(town) // will output:
    /* {
    type: 'town',
    id: '123',
    name: 'Barcelona',
    country: {
        type: 'country',
        id: '32',
        name: 'Spain'
        },
        relationshipNames: ['country']
    } */
})

resource.fetchTown(123, 'country').then((country) => {
    console.log(country) // will output:
    /* {
        type: 'country',
        id: '32',
        name: 'Spain'
    } */
})

```

To setup multiple resources 'api.js'

```javascript
import axios from '@/utils/axios'
import { JsonApiResources } from '@/jsonapi'

const httpService = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/vnd.api+json',
    },
});

export default {

    ...JsonApiResources([
        'orders',
        'accounts',
        'products',
    ], httpService),

    getVersion(params) {
        return new Promise((resolve, reject) => {
            httpService.get('version', { params })
            .then((response) => resolve(response))
            .catch((error) => reject(error))
        })
    },

}
```


To use them

```javascript
import api from '@/api'

api.fetchOrder(1)  // single record
api.fetchOrders()  // all orders
api.createOrder({...})  // create new order
api.updateOrder(order)  // update order
api.removeOrder(order) // delete order

api.fetchAccount(1)  // single record
api.fetchAccounts()  // all accounts
api.createAccount({...})  // create new account
api.updateAccount(account)  // update account
api.removeAccount(account) // delete account
```

To access raw data response

```javascript

const accessRawResponseCallback = (rawResponse, dataFormatter) => {
    console.log(rawResponse) // will output:
    /* {
        config: {url: …}
        data: {data: {type: 'town', id: '123', …}, included: Array(1)}
        headers: {date: cache-control: "no-cache, private", …}
        request: XMLHttpRequest {onreadystatechange: ƒ, readyState: 4, …}
        status: 200
        statusText: "OK"
    } */
    dataFormatter.deserialize(rawResponse.data) // will output:
    /* {
    type: 'town',
    id: '123',
    name: 'Barcelona',
    country: {
        type: 'country',
        id: '32',
        name: 'Spain'
        },
        relationshipNames: ['country']
    } */
    dataFormatter.serialize({
        stuff: town, // can handle array
        includeNames: ['country']
    }); // will output:
    /* {
        data: {
              type: 'town',
              id: '123',
              attributes: {
                  name: 'Barcelona',
              },
              relationships: {
                  country: {
                      data: {
                          type: 'country',
                          id: '32',
                      }
                  }
              }
        },
        included: [{
            type: 'country',
            id: '32',
            attributes: {
                name: 'Spain',
            }
        }]
    }*/
}

api.fetchTown(123, { params }, accessRawResponseCallback)

```


Endpoints

```javascript

api.fetchOrder({ id: 1, type: 'orders' } || 1, reletionship, params) // GET
api.fetchOrders(params) // GET
api.createOrder({ type: 'orders' }, params) // POST
api.updateOrder({ id: 1, type: 'orders' }, params) // PATCH
api.removeOrder({ id: 1 } || 1) // DELETE

```

# jsona-resource
