(function ($) {

  $(document).ready(function () {

    // View a group's messages

    function intersection_destructive(a, b) {
      var result = new Array();
      while (a.length > 0 && b.length > 0) {
        if (a[0] < b[0]) {
          a.shift();
        } else if (a[0] > b[0]) {
          b.shift();
        } else /* they're equal */ {
          result.push(a.shift());
          b.shift();
        }
      }

      return result;
    }

    Array.prototype.remove = function () {
      var what, a = arguments,
        L = a.length,
        ax;
      while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
          this.splice(ax, 1);
        }
      }
      return this;
    };

    if (window.io && iris.server) {

      iris.chatReciever = io(iris.server);

      iris.chatReciever.on('userConnect', function (uid) {
        if (uid !== iris.credentials.userid) {
          iris.updateGroupOnline(parseInt(uid), 'online');
          iris.entityListUpdate.detail = {
            entities: {}
          };
          document.dispatchEvent(iris.entityListUpdate);
        }

      });

      iris.chatReciever.on('userDisconnect', function (uid) {

        if (uid !== iris.credentials.userid) {
          iris.updateGroupOnline(parseInt(uid), 'offline');

          iris.entityListUpdate.detail = {
            entities: {}
          };
          document.dispatchEvent(iris.entityListUpdate);
        }
      });

      /*iris.chatReciever.on('messageReceived', function (groups) {
        
        if (groups) {
          iris.entityListUpdate.detail = {
            entities: {}
          };
          iris.fetchEntities("messages", {
            entities: ["message"],
            queries: [{
              "field": "groups",
              "operator": "includes",
              "value": groups[0]
            }],
            sort: {
              field_created: 'asc'
            }

          });
          document.dispatchEvent(iris.entityListUpdate);
        }

      });*/
    }

    document.addEventListener('entityListUpdate', function (e) {
      if (e.detail.entities.message) {

        if ($('.conversation-inner ul')[0]) {
          $('.conversation-inner ul')[0].scrollTop = $('.conversation-inner ul')[0].scrollHeight;
        }

      } else if (e.detail.entities.group) {

        e.detail.entities.group.forEach(function (group, index) {

          var current = iris.unread;
          iris.unread += group.unread;

          var groupUsers = iris.getGroupUserIds(iris.fetchedEntities.group[group.eid].field_users);
          var onlineGroupUsersArray = intersection_destructive(groupUsers, Object.keys(iris.online));
          onlineGroupUsersArray.remove(parseInt(iris.credentials.userid));

          // We want to convert to array to an object to better find and remove elements.
          var onlineGroupUsers = {};
          onlineGroupUsersArray.forEach(function (value) {
            onlineGroupUsers[value] = true;
          });

          if (onlineGroupUsersArray.length > 0) {
            iris.fetchedEntities.group[group.eid].online = onlineGroupUsers;
          } else if (iris.fetchedEntities.group[group.eid].online) {
            delete iris.fetchedEntities.group[group.eid].online;
          }


          if (current === 0 && iris.unread > 0) {

            document.title = "(" + iris.unread + ")" + " " + document.title;

          } else if (current > 0 && iris.unread === 0) {

            document.title = document.title.replace("(" + current + ")" + " ", "");

          } else {

            document.title = document.title.replace("(" + current + ")" + " ", "(" + iris.unread + ")" + " ");

          }
        });

        if ($('.group.active .conversation-inner ul')[0]) {
          $('.group.active .conversation-inner ul')[0].scrollTop = $('.group.active .conversation-inner ul')[0].scrollHeight;
        }

      } else if (e.detail.entities.user) {
        e.detail.entities.user.forEach(function (user) {
          if (user.eid !== parseInt(iris.credentials.userid)) {
            if (e.detail.event === 'delete') {
              delete iris.online[user.eid];
            } else if (user.online === true) {
              iris.updateGroupOnline(user.eid, 'online');

            } else if (iris.online[user.eid]) {
              iris.updateGroupOnline(user.eid);
            }
          }
        });
      }


    }, false);


    iris.updateGroupOnline = function (uid, status) {

      if (status == 'online') {
        iris.online[uid] = true;
        if (iris.fetchedEntities.group) {
          iris.fetched.groups.entities.forEach(function (group) {
            if (iris.getGroupUserIds(group.field_users).indexOf(uid) >= 0) {

              if (!iris.fetchedEntities.group[group.eid].online) {
                iris.fetchedEntities.group[group.eid].online = {};
              }
              iris.fetchedEntities.group[group.eid].online[uid] = true;
            }
          });
        }
      } else if (status == 'offline') {
        delete iris.online[uid];
        if (iris.fetchedEntities.group) {
          iris.fetched.groups.entities.forEach(function (group) {
            if (iris.getGroupUserIds(group.field_users).indexOf(uid) >= 0) {
              if (iris.fetchedEntities.group[group.eid].online && iris.fetchedEntities.group[group.eid].online[uid]) {
                delete iris.fetchedEntities.group[group.eid].online[uid];
              }
            }
          });
        }
      }
    }

    $("body").on("click", "#grouplist .group", function (e) {
      var groupid = jQuery(this).data("group");
      $.get(iris.server + '/read-group/' + groupid + '/' + iris.credentials.userid);
      iris.currentGroup = groupid;
      iris.setActiveGroup(groupid, false);
      iris.fetchEntities("messages-" + groupid, {
        entities: ["message"],
        queries: [{
          "field": "groups",
          "operator": "includes",
          "value": groupid
        }],
        sort: {
          field_created: 'asc'
        }

      });

      iris.fetchEntities("members", {
        entities: ["group"],
        queries: [{
          "field": "eid",
          "operator": "IS",
          "value": groupid
        }]

      });

    });

    $("body").on("click", ".members-view, #message-count", function (e) {
      $(this).parent().toggleClass('closed');
    });

    // Post a message

    $("body").on("submit", ".submit-message-from", function (e) {

      var value = $(".message-textfield", $(this)).val();

      $(".message-textfield", $(this)).val("");

      iris.createMessage(iris.credentials, value, [iris.currentGroup]);

      return false;

    });

    // Search for users

    $("body").on("keyup", "#chat-search-field", function () {
     
      var value = $("#chat-search-field").val();

      if (value.length) {

        iris.fetchEntities("users", {
          entities: ["user"],
          queries: [{
            "field": "username",
            "operator": "contains",
            "value": $("#chat-search-field").val()
            }]

        });

      } else {

        iris.fetchEntities("users", {

          entities: ["user"]

        });
      }

    });


    // Create new group by selecting user from search results.
    $('body').on('click', '#chat-search li span:not(.add)', function (e) {
      
      var current_uid = iris.credentials.userid;
      var selected_uid = jQuery(this).parent().data('userid');
     
      var groupId = iris.groupExists(selected_uid);
      if (groupId) {
        iris.togglerecent();
        
        $('#grouplist .group[data-group=' + groupId + ']').click();
        return false;
      }

      var entity = {
        name: iris.generateGroupName([current_uid, selected_uid]),
        field_121: true,
        field_users: [{
          field_uid: current_uid
                    }, {
          field_uid: selected_uid
                    }]
      };

      iris.createGroup(entity);


    });

    // Add a member to the group or create new multi-user group.
    $("body").on("click", "#chat-search li span.add", function (e) {

      var selected_uid = $(this).parent().data("userid");

      if (iris.userExistsInGroup(iris.fetchedEntities.group[iris.currentGroup], selected_uid)) {

        alert("User already exists in this group.");
        return false;

      } else {

        // If it's not a 121 group, add user to current group.
        if (iris.fetchedEntities.group[iris.currentGroup].field_121 !== true) {

          var groupEntity = iris.fetchedEntities.group[iris.currentGroup];
          groupEntity.field_users.push({
            field_uid: selected_uid
          });

          groupEntity.name = iris.generateGroupName(iris.getGroupUserIds(groupEntity.field_users));

          iris.editGroup(groupEntity);

        } else {
          // Create new multi-user group.

          var users = JSON.parse(JSON.stringify(iris.fetchedEntities.group[iris.currentGroup].field_users));
          users.push({
            field_uid: selected_uid
          });
          var name = iris.generateGroupName(iris.getGroupUserIds(users));
          var entity = {
            name: name,
            field_users: users
          };

          iris.createGroup(entity);

        }


        /*if ($scope.currentGroup) {
          jQuery.post(iris.server + '/groups/addMember/' + $scope.currentGroup + '/' + userid + '/drupal_user/field_users.field_uid', {
            credentials: iris.credentials
          }, function (err, result) {

            console.log(err, result);

          });
        }*/
      }

    });


    jQuery(".lookup-title.recent").click(iris.togglerecent);
    jQuery(".lookup-title.search").click(iris.togglesearch);

  });
}(jQuery))
