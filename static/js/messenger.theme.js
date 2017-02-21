
if (!iris.theme) {
  iris.theme = {};
}

iris.theme.GenericUserImage = function () {

  var html = '';

  html += "/sites/all/themes/hub/img/hub-picture-default.png";

  return html;

}

iris.theme.GenericGroupImage = function () {

  var html = '';

  html += "/sites/all/themes/hub/img/hub-group.png";

  return html;

}

iris.theme.GenericReadOnlyImage = function () {

  var html = '';

  html += "/sites/all/themes/hub/img/hub-icon.png";

  return html;

}

/**
 * Provide the HTML to create chat messages.
 */
iris.theme.ChatMessage = function (message) {
  var html = '';

  var time = chat.mongotime(message._id);
  var formattedtime = chat.formatTime(time);

  html += '<div class="message" data-messageid="' + message._id + '" data-userid="' + message.userid + '" data-toggle="tooltip" title="' + formattedtime.date + ' ' + formattedtime.time + '">';

  jQuery.each(message.content, function (index, content) {

    if (iris.theme.MessageTemplate[index]) {

      html += iris.theme.MessageTemplate[index]({
        content: content,
        formattedtime: formattedtime,
        username: message.username
      });

    }

  });
  if (chat.user.id === message.userid && message.content.text) {
    html += '<span class="message-tools">';
    html += '<span class="glyphicon glyphicon-pencil editmessage"aria-hidden="true" title="' + 'Edit' + '" data-toggle="tooltip"></span>';
    html += '<span class="glyphicon glyphicon-trash editmessage"aria-hidden="true" title="' + 'Delete' + '" data-toggle="tooltip"></span>';
    html += '</span>';
  }
  html += '</div>';

  return html;
};

/**
 * Provide the HTML to create popup message notifications
 */
iris.theme.PopupMessage = function (message) {
  var html = '';

  html = '<div class="chat-notification" style="display: none" data-groupid="' + message.groupid + '">';

  html += '<div class="chat-notification-header">';
  if (chat.groups[message.groupid].is121) {
    html += message.username;
    html += "<span class='close-popup glyphicon glyphicon-remove'></span>";
    html += '</div>';
    html += '<div class="chat-notification-sub">';
    html += ' at ' + Date.now().toString();
    html += '</div>';
  } else {
    html += chat.groups[message.groupid].name;
    html += "<span class='close-popup glyphicon glyphicon-remove'></span>";
    html += '</div>';
    html += '<div class="chat-notification-sub">';
    html += message.username + ' at ' + Date.now().toString();
    html += '</div>';
  }
  html += '<div class="chat-notification-message">';
  html += message.content.text;
  html += '</div>';
  html += '</div>';

  return html;

};

iris.theme.GroupListItem = function (group, $scope) {
  var html = '';

  var classes = [];
  var grouptype;

  // For 121 groups...
  var userid = '';
  var online = '';

  if (group.online && Object.keys(group.online).length > 0) {
    online = 'online';
  }

  // Check readonly
  /*if (group.isReadOnly) {
    grouptype = 'readonly';
    classes.push('readonly');
  }

  // Look for reference type
  if (group.reftype) {
    if (group.reftype === 'event') {
      classes.push('event');
    } else if (group.reftype === 'og') {
      classes.push('og');
    }
  }*/

  if (!group.field_avatar) {
    /*if (group.isReadOnly) {
      // Generic Hub group image
      group.avatar = iris.theme.GenericReadOnlyImage();
    } else */
    if (group.field_121) {
      // Generic user profile image
      group.field_avatar = iris.theme.GenericUserImage();
    } else {
      // Image used for ad hoc groups
      group.field_avatar = iris.theme.GenericGroupImage();
    }
  }

  var printclasses = '';

  jQuery.each(classes, function (index, element) {
    printclasses += element;
    printclasses += ' ';
  });

  var name = [];
  if (group.name.indexOf('|user:') === 0) {
    jQuery.each(group.field_users, function (index, group_user) {
      if (iris.credentials.userid != group_user.field_uid) {
        if (iris.fetched.users && iris.fetched.users.entities) {
          jQuery.each(iris.fetchedEntities.user, function (inner, user) {
            if (parseInt(user.eid) === group_user.field_uid) {
              name.push(user.username);
            }
          });
        }
      }
    });
    
    name = name.join(', ');
  }
  else {
    name = group.name;
  }

  

  html += '  <span class="image-container online-surround ' + online + '">';
  html += '    <img src="' + group.field_avatar + '">';
  html += '  </span>';
  html += '  <span>' + name + '</span> <span class="unread">';
  if (group.unread && group.unread > 0) {
    html += group.unread;
  }
  html += '</span>';
  /*if (group.reftype === 'event') {
    html += '<span class="event-start" data-starttime="' + group.starttime + '" data-endtime="' + group.endtime + '">(' + iris.theme.MeetingTime(group.starttime * 1000, group.endtime * 1000) + ')</span>';
  }*/

  return html;
};

iris.theme.listMembersDisplay = function(member, $scope) {
  for (var i = 0; i < iris.fetched.users.entities.length; i++) {
    if (iris.fetched.users.entities[i].eid == member.field_uid) {
      return iris.fetched.users.entities[i].username;
    }
  } 
}

iris.theme.UserSearchItem = function (user, $scope) {
  var html = '';
  var onlineclasses = 'online-surround';

  /*if (jQuery.inArray(user.uid, chat.onlineusers) > -1) {
    onlineclasses += ' online';
  }*/

  if (user.field_avatar) {
    html += '  <span class="image-container ' + onlineclasses + '"><img src="' + user.field_avatar + '"></span>';
  } else {
    html += '  <span class="image-container ' + onlineclasses + '"><img src="' + iris.theme.GenericUserImage() + '"></span>';
  }
  html += '<span class="name">' + user.username + '</span>';
  if (iris.currentGroup && iris.fetchedEntities.group[iris.currentGroup].entityAuthor == iris.credentials.userid) {
    //Check if user isn't already in group

    var alreadyin = false;
    jQuery.each(iris.fetchedEntities.group[iris.currentGroup].field_users, function (index, element) {

      if (element.field_uid === user.eid) {

        alreadyin = true;

      };

    });

    if (!alreadyin) {

      html += '<span class="add glyphicon glyphicon-plus" aria-hidden="true"><span class="arrow">&#57490;</span></span>';

    }

  }

  return html;
};

iris.theme.ChatGroupMemberCount = function (count) {

  var html = '';

  //Don't show count for 1to1 group

  if (!chat.groups[chat.user.activegroup].is121) {

    html += '<span class="glyphicon glyphicon-user" aria-hidden="true"></span>';
    html += '<span>' + count + '</span>';

  }

  return html;

};

iris.theme.GroupMemberListItem = function (user, group) {

  var html = '';
  var onlineclasses = 'online-surround';

  if (jQuery.inArray(user.uid, chat.onlineusers) > -1) {
    onlineclasses += ' online';
  }

  html += '<li data-userid="' + user.uid + '">';
  if (user.avatar) {
    html += '<span class="image-container ' + onlineclasses + '"><img src="' + user.avatar + '"></span>';
  } else {
    html += '<span class="image-container ' + onlineclasses + '"><img src="' + iris.theme.GenericUserImage() + '"></span>';
  }
  html += user.username;
  if (!group.isReadOnly) {
    html += '<a class="group-action group-action-remove-user"><span class="glyphicon glyphicon-remove"></span>' + 'Remove' + '</a>';
  }
  html += '</li>';

  return html;
}

iris.theme.MediaCallWindow = function () {

  var html = '';

  html += "<h2>" + "Call in progress." + "</h2>";

};

iris.theme.MediaCallStream = function () {

};

// Templates for rendering messagetypes

iris.theme.MessageTemplate = {};

iris.theme.MessageTemplate.text = function (contents) {

  var html = '';

  html += '<span class="author" title="at ' + contents.formattedtime.date + ' ' + contents.formattedtime.time + '">' + contents.username + '</span>: ';
  html += '<span class="message-content">' + contents.content + '</span>';

  return html;
}

iris.theme.MessageTemplate.file = function (contents) {

  var html = '';

  var fileinfo = JSON.parse(contents.content);

  fileinfo.size = (fileinfo.size / 1000000).toFixed(2);

  html += '<span class="author" title="at ' + contents.formattedtime.date + ' ' + contents.formattedtime.time + '">' + contents.username + '</span>: ';
  html += '<span class="message-content">' + "<a  class='filelink' href='javascript:void(0)' data-id='" + fileinfo.id + "' data-size='" + fileinfo.size + "' data-peer='" + fileinfo.peerid + "' data-groupid='" + fileinfo.groupid + "'>" + fileinfo.name + " " + "(" + fileinfo.size + "MB)" + '</span>';

  return html;
}

iris.theme.MessageTemplate.groupupdate = function (contents) {

  var html = '';

  contents.content = JSON.parse(contents.content);

  if (contents.content.action === 'add') {

    html += '<span class="message-content">' + contents.username + " has joined the group." + '</span>';
  }

  return html;

};

iris.theme.MessageTemplate.downloadedfile = function (contents) {

  var html = '';

  var fileinfo = contents.content;

  html += '<span class="author" title="at ' + contents.formattedtime.date + ' ' + contents.formattedtime.time + '">' + contents.username + '</span>: ';
  html += '<span class="message-content">' + '<a href="' + fileinfo.link + '" download="' + fileinfo.filename + '">' + "Download " + fileinfo.filename + "</a></span>";

  return html;
};

iris.theme.MessageTemplate.mediacall = function (contents) {
  var html = '';

  if (contents.content.action === 'end') {
    html += '<span class="message-content">' + "<b>Call ended</b> at " + contents.formattedtime.date + ' ' + contents.formattedtime.time + " (" + chat.formatTimeInterval(contents.content.timestamp) + ")" + '</span>';
  } else {
    html += 'Media call.';
  }

  return html;

}

iris.theme.TimeRemaining = function (time) {
  var difference = time - Date.now();

  // Less than 1 minute
  if (difference < 60000) {
    return "<1 min";
  }

  // Less than 1 hour
  else if (difference < 3.6e6) {
    return Math.round(difference / 60000).toString() + ' min';
  }

  // Less than 24 hours
  else if (difference < 86400000) {
    return Math.round(difference / 3.6e6).toString() + ' h';
  }
  // Less than 48 hours
  else if (difference < 86400000 * 2) {
    return "tomorrow";
  } else {

    var reldate = new Date(time);

    return reldate.getDate() + '/' + (reldate.getMonth() + 1) + '/' + reldate.getFullYear();

  }
}

iris.theme.MeetingTime = function (starttime, endtime) {

  var starttime = new Date(starttime);
  var endtime = new Date(endtime);

  if (starttime > Date.now()) {

    return iris.theme.TimeRemaining(starttime);

  } else if (endtime > Date.now()) {
    return "in progress";
  } else {
    return "finished";
  }
}

iris.theme.MeetingAgendaChecklist = function (agenda, entityref) {

  var html = '';

  html += '<div class="agenda-items" data-entityref="' + entityref + '">';
  html += '<h3>Agenda</h3>';

  try {
    agenda = JSON.parse(agenda);
  } catch (e) {
    // try with given agenda
  }

  agenda.forEach(function (element, index) {

    if (element['field_agenda_item']['und'] && element['item_id']) {

      var checkboxname = element['field_agenda_item']['und'][0]['safe_value'];
      var itemid = element['item_id'];

      var checked = '';

      if (element['field_agenda_item_completed']['und'][0]['value'] == 1) {
        checked = 'checked ';
      };

      html += '<label><input type="checkbox" name="agenda-item" value="' + checkboxname + '" data-itemid="' + itemid + '" ' + checked + '/> ' + checkboxname + '</label>';

    }

  });

  html += '</div>';

  return html;

}

iris.theme.getUserInfo = function(eid){

	var user = iris.fetched.users.entities.filter(function(obj) {
	      if(obj.eid == eid) {   
	    	  return obj;
	      }
	    })[0];
  return user;
	
	
};
