(function ($) {

  $(document).ready(function () {

    iris.angular.controller("chat", ["$scope", "$element", "$attrs", "$timeout", "$sce", function ($scope, $element, $attrs, $timeout, $sce) {

      // Angular functions.
      $scope.userSearchItem = function (obj) {
        return $sce.trustAsHtml(iris.theme.UserSearchItem(obj, $scope));
      }

      $scope.recentGroupItem = function (group) {
        return $sce.trustAsHtml(iris.theme.GroupListItem(group, $scope));
      }

      $scope.listMembersDisplay = function (member) {
    
        return $sce.trustAsHtml(iris.theme.listMembersDisplay(member, $scope));
      }
      
      $scope.displayUser = function (eid) {
    	  return iris.theme.getUserInfo(eid);
      }

      $scope.displayMessage = function (message) {

        var output = iris.theme.ChatMessage(message);
        return $sce.trustAsHtml(output);

      }

      $scope.getGroupMessages = function(gid) {

        if (typeof iris.fetched['messages-' + gid] != 'undefined' && typeof iris.fetched['messages-' + gid].entities != 'undefined') {
            return iris.fetched['messages-' + gid].entities;
        }
        else {
          return [];
        }
      }

      iris.currentGroup = null;
      $scope.currentGroup = iris.currentGroup;

      $scope['messages'] = [];

      iris.updateMessages = function(messages) {

        $scope['messages'] = messages;
        $scope.$apply();

        setTimeout(function() {
            if ($('.conversation-inner ul')[0]) {
                $('.conversation-inner ul')[0].scrollTop = $('.conversation-inner ul')[0].scrollHeight;
            }
        },30)

      }

      //iris.fetched['messages'] = {};
      
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

     /* iris.fetchEntities("messages", {
        entities: ["message"],
        queries: [{
          "field": "groups",
          "operator": "includes",
          "value": groupid
        }],
        sort: {
          field_created: 'asc'
        }

      });*/

      iris.fetchEntities("users", {

        entities: ["user"]

      });

   }]);

  });
  
})(jQuery);
