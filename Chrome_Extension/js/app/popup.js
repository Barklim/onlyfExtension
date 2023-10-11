console.log('popup.js loaded');
console.log('angular version:');
console.log(angular.version);
// docs https://code.angularjs.org/1.2.27/docs/guide/scope


let OFTracker = angular.module("oftracker", ['ui.router']);

OFTracker.config(function($stateProvider, $urlRouterProvider){

	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '../views/home.html'
		})
		.state('login', {
			url: '/login',
			templateUrl: '../views/login.html'
		})
		.state('signup', {
			url: '/signup',
			templateUrl: '../views/signup.html'
		})
		.state('welcome', {
			url: '/welcome',
			templateUrl: '../views/welcome.html'
		})
		
	$urlRouterProvider.otherwise('login')
})

const errorBacks = ($scope, response) => {
	if (response.statusCode === 400) {
		$scope.$apply(function() {
			if (response.message) {
				$scope.errorText = String(response.message);
			} else {
				$scope.errorText = 'Bad request';
			}
		});
	}
	if (response.statusCode === 409) {
		$scope.$apply(function() {
			$scope.errorText = 'Conflict. User with this email alredy exist';
		});
	}
}

// ----- services -----

OFTracker.service("DataService", function($http) {
    this.fetchData = function() {
        return $http.get('http://localhost:3000/coffees');
    }
});

// ----- controllers -----

OFTracker.controller("PopupCtrl", ['$scope', '$state', 'DataService', function($scope, $state, DataService){
	console.log('PopupCtrl Initialized');

	$scope.init = function() {
		utils.getStorageItem('user', function (userData) {
			const token = userData
			if (token) {
				$state.go('welcome');
			} else {
				$state.go('login')
			}
		})
	}

	$scope.login = function(formData) {
		// console.log('1. formData from Login: ', formData);
		chrome.runtime.sendMessage({type: "login", data: formData},
			function(response){
				// console.log('response from the background is: ', response);
				if(response.accessToken) {
					// var decoded = jwt_decode(response.accessToken);
					// $scope.name = response.user.username; 
					// $scope.name = decoded.email;		
					$state.go('welcome');
				} else {
					$scope.$apply(function() {
						$scope.errorText = String(response.message);
					});
				}
			} 
		)
	}

	$scope.signup = function(formData) {
		// console.log('formData from Signup: ', formData);
		chrome.runtime.sendMessage({type: "signup", data: formData},
			function(response) {
				errorBacks($scope, response)

				if(response.accessToken) {
					// var decoded = jwt_decode(response.accessToken);
					// $scope.name = response.user.username; 
					// $scope.name = decoded.email;		
					$state.go('welcome');
				} else {
					if (response.statusCode === 201) {
						$scope.$apply(function() {
							$scope.errorText = '';
						});
						$state.go('welcome');
					}
					// if(response.token){
					// 	$state.go('login');
					// }
				}
			}
		)
	}

	$scope.logout = function() {
		chrome.storage.sync.get(['user'], function (result) {
			console.log('Value before removal: ', result.user);
			chrome.storage.sync.remove(['user'], function (result) {
				console.log('Result of removal: ', result);
			});
		});

		utils.removeStorageItem('user')
			.then((result) => {
				console.log('Successfully removed "user" storage item', result);
				$state.go('login');
			})
			.catch((error) => {
				console.error('Error removing "user" storage item', error);
			});
	}
}]);

OFTracker.controller("ScraperCtrl", ['$scope', '$state', function($scope, $state){
	console.log('ScraperCtrl Initialized');

	$scope.initWelcomePage = function() {
		utils.getLSUserId().then(id => {
			chrome.runtime.sendMessage({type: "initWelcomePage", data: { id: id }},
				function(response){
					console.log('response from the background is: ', response);
					if(response?.email) {
						$scope.$apply(function() {
							$scope.name = response.email;
						});
						$scope.name = response.email;
					} else {
						$scope.errorText = String(response.message);
						$scope.name = '123';
					}	
				})
		});
	}
}]);