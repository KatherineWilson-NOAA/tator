// Misc. Utilities for Tator

function getCookie(name) {
  let value = "; " + document.cookie;
  let parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts.pop().split(";").shift();
  }
}

class Utilities
{
  static showSuccessIcon(message, color, noFade)
  {
    const el = window.tator_success_light;
    if (el)
    {
      if (noFade) {
        el.message(message, color);
      }
      else {
        el.fade_message(message, color);
      }
    }
    else
    {
      console.warn("Couldn't find tator_success_light element!");
    }
  }

  static hideSuccessIcon()
  {
    const el = window.tator_success_light;
    if (el)
    {
      el.hide();
    }

  }

  static warningAlert(message, color, noFade)
  {
    const el = window.tator_warning_light;
    if (el)
    {
      if (noFade) {
        el.message(message, color);
      }
      else {
        el.fade_message(message, color);
      }
    }
    else
    {
      console.warn("Couldn't find element!");
    }
  }

  static hideAlert()
  {
    const el = window.tator_warning_light;
    if (el)
    {
      el.hide();
    }
  }
  // Get the download request object
  static getDownloadRequest(media_element, session_headers)
  {
    // Download original file if available.
    let url;
    let http_authorization;
    let hostname;
    let path;
    var media_files = media_element.media_files;
    if (media_files)
    {
      if (media_files.layout)
      {
        return null;
      }
      if (media_files.image)
      {
        path = media_files.image[0].path;
        http_authorization = media_files.image[0].http_auth;
        hostname = media_files.image[0].host;
      }
      else if (media_files.archival)
      {
        path = media_files.archival[0].path;
        http_authorization = media_files.archival[0].http_auth;
        hostname = media_files.archival[0].host;
      }
      else if (media_files.streaming)
      {
        path = media_files.streaming[0].path;
        http_authorization = media_files.streaming[0].http_auth;
        hostname = media_files.streaming[0].host;
      }
      else
      {
        let fname = media_element.name;
        console.warn(`Can't find suitable download for ${fname}`);
      }
    } else if (media_element.file) {
      url = "/media/" + media_element.file;
    } else {
      let fname = media_element.name;
      console.warn(`Can't find suitable download for ${fname}`);
    }

    // We either have a url set (old way) or a path and potentially host
    // and http_auth

    let request = null;
    if (url == undefined)
    {
      if (path) {
        if (path.startsWith('/')) {
          let sameOrigin = false;
          // Default to self if hostname
          if (hostname == undefined)
          {
            hostname = window.location.protocol + "//" + window.location.hostname;
            sameOrigin = true;
          }
          url = hostname + path;
          if (sameOrigin == true)
          {
            request = new Request(url,
                                  {method: "GET",
                                   credentials: "same-origin",
                                   headers: session_headers
                                  });
          }
          else
          {
            let cross_origin = new Headers();
            cross_origin.append("Authorization", http_authorization);
            // Don't leak CSRF or session to cross-domain resources
            request = new Request(url,
                                  {method: "GET",
                                   credentials: "omit",
                                   headers: cross_origin
                                  });
          }
        } else if (path.startsWith('http')) {
          url = path;
          request = new Request(url,
                                {method: "GET",
                                 credentials: "omit",
                                });
        }
      }
    }
    else
    {
      // Deprecated behavior (this is the same host)
      request = new Request(url,
                            {method: "GET",
                             credentials: "same-origin",
                             headers: session_headers
                            });
    }

    return request;
  }

  // Returns a promise with the clients IP
  static getClientIP()
  {
    var promise = new Promise((resolve) => {
      fetch('https://jsonip.com').then((response) => {
        return response.json();
      }).then((json) => {
        resolve(json['ip']);
      });
    });
    return promise;
  }

  // Send a notifiation to admins
  static sendNotification(msg, sendAsFile)
  {
    let request_body = {"message": msg};
    if (sendAsFile == true)
    {
      request_body["sendAsFile"] = 1;
    }
    return fetch("/rest/Notify",
                 {method: "POST",
                  body: JSON.stringify(request_body),
                  credentials: "same-origin",
                  headers: {
                    "X-CSRFToken": getCookie("csrftoken"),
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                  }
                 });
  }

  static errorPageFunction(code)
  {
    Utilities.getClientIP().then((ip) => {
      var message=`Error ${code} from ${ip}`;
      Utilities.sendNotification(message);
    });
  }
}
