# checkAuth design

## RATIONALE

Each request to the S3 Connector must be authenticated in the same manner in
which AWS S3 authenticates requests.

## CHECK AUTH

Authentication can be achieved through one of the following methods:

* AWS Signature Version 2 using headers
* AWS Signature Version 2 using query parameters
* AWS Signature Version 4 -- TO BE COMPLETED

If there is an authentication header on the request object, checkAuth
determines whether Version 2 or Version 4 using headers is applicable by
parsing the authentication header string.

If there is no authentication header on the request object, checkAuth
determines whether Version 2 or Version 4 using query parameters is applicable
by checking which query parameters are included on the request object.

### AWS Signature Version 2 using headers

1. Checks to make sure request is not more than 15 minutes old and returns an
   error if it exceeds the time requirement.
2. Obtains the accessKey and signature by parsing the string value of the
   authorization header on the request object.

See Common Steps for Signature Version 2

### AWS Signature Version 2 using query parameters

1. Checks to make sure the request has not expired by checking the "Expires"
   query parameter.
2. Obtains the accessKey from the "AWSAccessKeyID" query parameter and obtains
   the signature from the "Signature" query parameter.

See Common Steps for Signature Version 2

### Common Steps for Signature Version 2

1. Build the stringToSign:

   ```
   HTTP-Verb + "\n" +
   Content-MD5 + "\n" +
   Content-Type + "\n" +
   Date (or Expiration for query Auth) + "\n" +
   CanonicalizedAmzHeaders +
   CanonicalizedResource;
   ```

2. utf8 encode the stringToSign.
3. Send to Vault: (a) the user provided signature, (b) the encoded
   stringToSign, (c) the user's accesskey.
4. Vault pulls the secretKey for the user based on the accessKey.
5. Vault uses either HMAC-SHA1 or HMAC-SHA256 (depending on the
   length of the signature in the request) with the secretKey
   and the utf8-encoded stringToSign as inputs to create a digest.
6. Vault Base64 encodes the digest. The result is the reconstructed
   signatures.
7. Vault compares the reconstructed signature with the signature provided by
   with the request. If the signatures match, it means that the requestor
   had the secretKey in order to properly encode the signature provided so
   authentication is confirmed and Vault returns true.  Otherwise, Vault
   returns false and the request is rejected.

### TO BE COMPLETED WITH VERSION 4

### Implementation of checkAuth

To add an authentication check to any route, include checkAuth as the first
function run upon receipt of a request to that route.  The checkAuth function
takes two arguments: (a) the request object and (b) a callback function to
handle any error messages or to proceed if authentication is successful.  The
checkAuth function returns the callback function with either (i) an error
message as the first argument if authentication is unsuccessful or (ii) null as
the first argument and an object containing info about the account as
the second argument if authentication is successful.

For instance, if you have a route to get an object, you would include checkAuth
as follows:

```js
router.get("/getObjectRoute", function(request, response){
    checkAuth(request, function(err, accessKey){
        if(err){
            // Return an error response
        }
        // Continue on with request
    })
})
```
