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

      iris.currentGroup = null;
      $scope.currentGroup = iris.currentGroup;
      
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

      iris.fetchEntities("users", {

        entities: ["user"]

      });

   }]);

  });
  
})(jQuery);;
