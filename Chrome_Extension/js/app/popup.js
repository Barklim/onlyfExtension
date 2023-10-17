console.log('popup.js loaded');
// console.log('angular version:');
// console.log(angular.version);
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
    this.fetchMe = function(token) {
		var config = {
			headers: {
				'Authorization': 'Bearer ' + token
			}
		};
		
		return new Promise(function(resolve, reject) {
			$http.get('http://localhost:3000/users/me', config)
				.then(function(response) {
					resolve(response.data);
				})
				.catch(function(error) {
					reject(error);
				});
        });
    }

	this.fetchRefreshTokens = function() {
		return new Promise(function(resolve, reject) {
			$http.post('http://localhost:3000/authentication/refresh-tokens')
				.then(function(response) {
					resolve(response.data);
				})
				.catch(function(error) {
					reject(error);
				});
        });
    }
});

// ----- controllers -----

OFTracker.controller("PopupCtrl", ['$scope', '$state', 'DataService', function($scope, $state, DataService){
	console.log('PopupCtrl Initialized');

	utils.getStorageItem('user', function (token) {
		if (token) {
			DataService.fetchMe(token).then(function(response) {
				console.log('Response from the API:', response.data);
				$state.go('welcome');
			}).catch(function(error) {
				// Back
				// console.error('Error while fetching data:', error);

				// TODO: by promises, promisify get tokens
				// DataService.fetchRefreshTokens().then(function(response) {
				// 	console.log('Response from the API:', response.data);
				// 	utils.setStorageItem('user', response.accessToken,  function (token) {
				// 		console.log('Response from the API:', response.data);
				// 		DataService.fetchMe(response.accessToken).then(function(response) {
				// 			// $state.go('welcome');
				// 		}).catch(function(error) {
				// 			console.error('Error while fetching data:', error);
				// 		});
				// 	})
				// }).catch(function(error) {
				// 	console.error('Error while fetching data:', error);
				// });
			});
		}
	});

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
						$scope.name = 'no email';
					}	
				})
		});
	}

	chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
		if (message.type === 'updateState') {
			$scope.$apply(function () {
				$scope.name = message.data.name;
			});
		}
		if (message.type === 'redirect') {
			chrome.storage.sync.remove(['user'], function (result) {
				console.log('Result of removal: ', result);
			});
			$state.go('login');
		}
	});

	// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	// 	if (message.type === 'users/me') {
	// 		$state.go('welcome');
	// 	}
	// });
}]);

// ----- listeneners -----

// chrome.storage.onChanged.addListener(
// 	(message) => {}
// )

