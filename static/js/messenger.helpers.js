(function ($) {

  $(document).ready(function () {

    iris.unread = 0;
    iris.online = {};
    
    iris.initialise = function () {
      
      iris.unread = 0;
      // Get all groups for current user.
      iris.fetchEntities("groups", {
        entities: ["group"],
        queries: [{
          "field": "field_users.field_uid",
          "operator": "IS",
          "value": iris.credentials.userid
        }],
        sort: {
          "field_last_updated": "desc"
        },

      });

      iris.fetchEntities("user", {

        entities: ["user"]

      });
    }

    iris.setActiveGroup = function (groupId, click) {
      iris.togglerecent();
      $('#grouplist .group').removeClass('active');
      setTimeout(function () {
        $('#grouplist .group[data-group=' + groupId + ']').addClass('active');
        if (click !== false) {
          $('#grouplist .group[data-group=' + groupId + ']').click();
        }
      }, 100);
    }

    iris.createGroup = function (entity) {

      entity.credentials = iris.credentials;

      jQuery.ajax({
        type: "POST",
        url: iris.server + '/entity/create/group',
        data: entity,
        success: function (group, status) {
          if (group) {
            iris.setActiveGroup(group.eid);
          }
        },
        error: function (jqXHR, status, errorThrown) {
          console.log(jqXHR, status);
        },
        dataType: 'json'
      });
    };

    iris.editGroup = function (entity) {

      entity.credentials = iris.credentials;

      delete entity.field_avatar;

      jQuery.ajax({
        type: "POST",
        url: iris.server + '/entity/edit/group/' + iris.currentGroup,
        data: entity,
        success: function (data, status) {
          iris.setActiveGroup(iris.currentGroup);
        },
        error: function (jqXHR, status, errorThrown) {
          console.log(jqXHR, status);
        },
        dataType: 'json'
      });
    }

    iris.generateGroupName = function (users) {
      users.sort();
      return '|user:' + users.join('-');
    }

    iris.getGroupUserIds = function (fieldset) {
      var users = [];
      jQuery.each(fieldset, function (index, user) {
        users.push(user.field_uid);
      });
      return users;
    }

    iris.userExistsInGroup = function (group, uid) {
      jQuery.each(group.field_users, function (inner, user) {
        if (user.field_uid == uid) {
          return true;
        }
      });
    }

    iris.groupExists = function (uid) {
      if (iris.fetched.groups && iris.fetched.groups.entities) {
        for (var i = 0; i < iris.fetched.groups.entities.length; i++) {
          //jQuery.each(iris.fetched.groups.entities, function (index, group) {
          if (iris.fetched.groups.entities[i].field_121 === true) {
            for (var j = 0; j < iris.fetched.groups.entities[i].field_users.length; j++) {
              //jQuery.each(group.field_users, function (inner, user) {
              if (iris.fetched.groups.entities[i].field_users[j].field_uid == uid) {
                return iris.fetched.groups.entities[i].eid;
              }
              //});
            }
          }
          //});
        }
        return false;
      } else {
        return false;
      }
    }

    iris.createMessage = function (credentials, content, groups) {
      $.post(iris.server + '/entity/create/message', {
          credentials: credentials,
          content: content,
          groups: groups
        },
        'json');

    }

    iris.togglesearch = function () {

      jQuery("#chat-search-results").html("");

      jQuery(".lookup-title.search").addClass("active");

      jQuery(".lookup-title.recent").removeClass("active");

      jQuery("#chat-search-pane").addClass('open');
      jQuery("#groupbar").removeClass('open');

    };

    iris.togglerecent = function () {

      jQuery("#chat-search-pane").removeClass('open');
      jQuery("#groupbar").addClass('open');

      jQuery(".lookup-title.recent").addClass("active");

      jQuery(".lookup-title.search").removeClass("active");

    };

  });
}(jQuery))
