      var clientId = '531668836192-rf50nsnragu2f9phedhhv4rrmphf1nmb.apps.googleusercontent.com';
      var apiKey = 'AIzaSyAYPWVJHJgdpcYbuUjCw3MzQ7g6thHtT0w';
      var scopes = 'https://www.googleapis.com/auth/gmail.readonly';
      var emailarr = [];
      //Array used to store all the datetime of the emails
      var datetime_output = [];

      function handleClientLoad() {
        // Step 2: Reference the API key
        gapi.client.setApiKey(apiKey);
        window.setTimeout(checkAuth,1);
      }

      function checkAuth() {
        gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
      }

      function handleAuthResult(authResult) {
        var authorizeButton = document.getElementById('authorize-button');
        if (authResult && !authResult.error) {
          authorizeButton.style.visibility = 'hidden';
          gapi.client.load('gmail', 'v1', function() {
          //Returns a list of email ids.
          p1 = new Promise(function(resolve,reject){
            listMessages('me','',function(result){
                resolve(result);
              });
          });
          //Once we get our lists of email ids, we create a bunch of requests and execute them as a batch
          p1.then(function(result){
            emailarr = result;
            var batch = gapi.client.newBatch();
            for(var i = 0; i < result.length; i++){
              batch.add(getMessage('me',result[i].id));
            }
            //executes the batch request to get all the email content in sent
            batch.then(function(response){
              //list of email objects
              var emails = response.result;
              //parse each email object to retrieve the datetime the email was sent
              for(res in emails){
                //If our queries get throttled
                if(emails[res].result.error){
                  continue;
                }
                if(emails[res].result.payload.headers || typeof emails[res].result.payload.headers != "undefined"){
                  var elems = emails[res].result.payload.headers;
                  for(var ind = 0 ; ind < elems.length; ind++){
                    if(elems[ind].name == "Date"){
                      var dt = elems[ind].value.split(/[ ,]+/);
                      var obj = [];
                      obj.push(new Date(elems[ind].value));
                      datetime_output.push(obj);
                    }
                  }
                }
              }
              console.log(datetime_output);
              //Do rendering work here.
            });
    
          });
          
          });

        } else {
          authorizeButton.style.visibility = '';
          authorizeButton.onclick = handleAuthClick;
        }
      }

      function handleAuthClick(event) {
        // Step 3: get authorization to use private data
        gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
        return false;
      }

      function listMessages(userId, query, callback) {
          var getPageOfMessages = function(request, result) {
            request.execute(function(resp) {
              result = result.concat(resp.messages);
              var nextPageToken = resp.nextPageToken;
              if (nextPageToken) {
                request = gapi.client.gmail.users.messages.list({
                  'userId': userId,
                  'pageToken': nextPageToken,
                  'q': query,
                  labelIds: ['SENT']
                });
                getPageOfMessages(request, result);
              } else {
                callback(result);
              }
            });
          };
          var initialRequest = gapi.client.gmail.users.messages.list({
            'userId': userId,
            'q': query,
            labelIds: ['SENT'],
          });
          getPageOfMessages(initialRequest, emailarr);
        }

        function getMessage(userId, messageId) {
          var request = gapi.client.gmail.users.messages.get({
            'userId': userId,
            'id': messageId,
            'format': "metadata"
          });
          return request
        }