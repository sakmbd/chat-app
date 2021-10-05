var socket = io();

$(document).ready(function() {
    var windowHeight = $(window).innerHeight();
    $('body').css({'height':windowHeight});
});

function scrollToBottom () {
  // Selectors
  var messages = jQuery('#messages');
  var newMessage = messages.children('li:last-child')
  // Heights
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function () {
  var params = jQuery.deparam(window.location.search);

  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error');
    }
  });
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users) {
  var ol = jQuery('<ol></ol>');

  users.forEach(function (user) {
    ol.append(jQuery('<li></li>').text(user));
  });

  jQuery('#users').html(ol);
});

socket.on('newMessage', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});

socket.on('newImg', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#img-template').html();
  var html = Mustache.to_html(template, {
    img: message.text,
    from: message.from,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();

});

socket.on('newLocationMessage', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#location-message-template').html();
  var html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});

jQuery('#message-form').on('submit', function (e) {
  e.preventDefault();

  var messageTextbox = jQuery('[name=message]');

  socket.emit('createMessage', {
    text: messageTextbox.val()
  }, function () {
    messageTextbox.val('')
  });
});

var locationButton = jQuery('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location.');
  });
});

document.getElementById('imageUpload').addEventListener('change', function() {
  if(!validateFile()) {
    // if file is not valid stop execution of below code
    return;
  }

  if (this.files.length != 0) {
      var file = this.files[0],
          reader = new FileReader(),
          color = "#000000";
      if (!reader) {
          that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
          this.value = '';
          return;
      };
      reader.onload = function(e) {
          this.value = '';
          socket.emit('img', e.target.result);
      };
      reader.readAsDataURL(file);
  };
}, false);

// File extension validation
function validateFile() {
  var allowedExtension = ['jpeg', 'jpg', 'png', 'gif', 'JPG', 'JPEG'];
  var fileExtension = document.getElementById('imageUpload').value.split('.').pop().toLowerCase();
  var isValidFile = false;

  for(var index in allowedExtension) {

      if(fileExtension === allowedExtension[index]) {
          isValidFile = true;
          break;
      }
  }

  if(!isValidFile) {
    alert('You can send only images.');
  }

  return isValidFile;
}
