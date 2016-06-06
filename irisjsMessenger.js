
/**
 * @file groups.js This module handles group, message and user management.
 */

var chatWindowBlock = {
  "type": "module",
  "id" : "irisjs-messenger-chat-window",
  "conf": "this is"
};

iris.modules.blocks.globals.registerBlock(chatWindowBlock);

/**
 * Callback to update the last_checked field on the group entity so that the correct unread count can be calculated.
 */
iris.route.get("/read-group/:gid/:uid", {}, function (req, res) {

  // Fetch the group entity.
  var fetch = {
    entities: ["group"],
    queries: [{
      field: "eid",
      "operator": "is",
      "value": req.params.gid
    }]
  };

  iris.invokeHook("hook_entity_fetch", req.authPass, null, fetch).then(function (group) {

    group = group[0];

    group.field_users.forEach(function (user, index) {

      if (user.field_uid == req.params.uid) {

        // Set the last_checked field to the current timestamp.
        group.field_users[index].field_last_checked = Math.floor(Date.now() / 1000);

        // Save the entity.
        iris.invokeHook("hook_entity_edit", 'root', group, group).then(function (success) {

        }, function (fail) {

          iris.log("error", fail);

        });
      }
    });

  });
  res.send('Registered');

});

/**
 * Implements hook_entity_presave.
 * Before a message is saved, update the last_updated field of the group to correctly order groups in lists.
 */
iris.modules.irisjsMessenger.registerHook("hook_entity_presave", 0, function (thisHook, entity) {

  if (entity.entityType == 'message') {

    entity.field_created = Math.floor(Date.now() / 1000);
    var fetch = {
      entities: ["group"],
      queries: [{
        field: "eid",
        "operator": "is",
        "value": (typeof entity.groups == 'array') ? entity.groups[0] : entity.groups
      }]
    };

    // Fetch the parent group.
    iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (groupResult) {

      if (groupResult.length > 0) {

        groupResult.forEach(function (group) {

          group.field_last_updated = Math.floor(Date.now() / 1000);

          iris.invokeHook("hook_entity_edit", thisHook.authPass, null, group).then(function (success) {

          }, function (fail) {

            iris.log("error", fail);

          });
        });
      }
    }, function (fail) {

      iris.log("error", fail);

    });

  }

  thisHook.pass(entity);

});

/**
 * Implements hook_entity_view_[entityType].
 * Get the unread messages since last checked in.
 */
iris.modules.irisjsMessenger.registerHook("hook_entity_view_group", 0, function (thisHook, entity) {

  var date;

  // Get the last_checked date to compare.
  if (entity.field_users) {
    entity.field_users.forEach(function (value) {
      if (value.field_uid == thisHook.authPass.userid) {
        date = value.field_last_checked;
      }
    });

    if (!date) {
      // If there is no last checked date, make it really old to fetch all messages.
      date = 0;
    }

    var fetch = {
      entities: ['message'],
      'queries': [{
        field: 'field_created',
        operator: 'gt',
        value: date
      },
        {
          field: 'groups',
          operator: 'INCLUDES',
          value: entity.eid
        }
      ]
    };

    iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (messages) {

      // If there are unread messages, add a temporary field to the group that is broadcast to clients but not saved
      // to the entity.
      if (messages) {

        entity.unread = messages.length;

      }

      thisHook.pass(entity);

    }, function (fail) {

      iris.log("error", fail);

      thisHook.fail(fail);

    });
  }
  else {

    thisHook.pass(entity);

  }

});

/**
 * Implements hook_entity_view_[entityType].
 * Adds a temporary field to the user entity that is broadcast to clients to determine if they are online or not.
 */
iris.modules.irisjsMessenger.registerHook("hook_entity_view_user", 0, function (thisHook, user) {

  if (user.eid && iris.modules.auth.globals.userList[user.eid]) {

    user.online = true;

  }
  else if (user.online) {

    delete user.online;

  }

  thisHook.pass(user);

});

/**
 * Implements hook_socket_authentication.
 * Broadcast a message to all clients when a user authenticates via socket.
 */
iris.modules.irisjsMessenger.registerHook("hook_socket_authenticated", 1, function (thisHook, data) {

  iris.sendSocketMessage(['*'], 'userConnect', thisHook.context.socket.authPass.userid);

  thisHook.pass(data);

});

/**
 * Implements hook_socket_disconnected.
 * Broadcast a message to all clients when a user disconnects via socket.
 */
iris.modules.irisjsMessenger.registerHook("hook_socket_disconnected", 1, function (thisHook, data) {

  iris.sendSocketMessage(['*'], 'userDisconnect', thisHook.context.userid);

  thisHook.pass(data);

});

iris.modules.irisjsMessenger.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.context.id === "irisjs-messenger-chat-window") {

    thisHook.context.context.tags.headTags["messenger"] = {
      type: "script",
      attributes: {"src": "/modules/irisjsMessenger/js/messenger.js"},
      rank: 2
    };

    thisHook.context.context.tags.headTags["messenger.theme"] = {
      type: "script",
      attributes: {"src": "/modules/irisjsMessenger/js/messenger.theme.js"},
      rank: 2
    };

    thisHook.context.context.tags.headTags["messenger.helpers"] = {
      type: "script",
      attributes: {"src": "/modules/irisjsMessenger/js/messenger.helpers.js"},
      rank: 2
    };

    thisHook.context.context.tags.headTags["messenger.events"] = {
      type: "script",
      attributes: {"src": "/modules/irisjsMessenger/js/messenger.events.js"},
      rank: 2
    };

    thisHook.context.context.tags.headTags["messenger.css"] = {
      type: "link",
      attributes: {"href": "/modules/irisjsMessenger/messenger.css", "rel" : "stylesheet", "type" : "text/css"},
      rank: 2
    };

    thisHook.pass('it works');

  }
  else {

    thisHook.pass(data);

  }

});