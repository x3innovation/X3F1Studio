module.exports = function(grunt) {

	var modRewrite = require('connect-modrewrite');

	// LOAD PLUG-INS
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-react');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-remove');
	
	// EVENT HANDLERS
	grunt.event.on('watch', function(action, filepath, target){
		grunt.log.writeln('');
		grunt.log.writeln(filepath + ' has ' + action);
		grunt.log.writeln('');
	});

	// TASKS DEFINITIONS
	function getAllVendorLibs()
	{
		var vendorLibs = [
			'jquery-2.1.3.js',
			'jquery-ui-1.11.3.js',
			'react-with-addons-0.12.2.min.js',
			'materialize-0.95.1.js',
			'react-router-0.11.6.js',
			'bullet-1.1.3-Jimin.js',
            'store-1.3.17.js',
            'jquery.fullPage-2.5.8.js'
		];

		for (var i = 0; i<vendorLibs.length; ++i)
		{
			vendorLibs[i] = './src/js/vendors/' + vendorLibs[i];
		}

		return vendorLibs;
	};
	
	// TASKS DEFINITIONS
	grunt.initConfig({
	
		browserify : {
			dist : {
				files : {
					'./dist/js/inhouse.js' : ['./src/js/inhouse/**/*.*'],
				},
				options : {
					transform : [require('grunt-react').browserify]
				}
			},
			dev : {
				files : {
					'./dev/js/inhouse.min.js' : ['./src/js/inhouse/**/*.*'],
				},				
				options : {
					transform : [require('grunt-react').browserify]
				}
			}
		},
		
		uglify : {
			dist: {
				files : {
					'./dist/js/vendors.min.js' : ['./dist/js/vendors.js'],
					'./dist/js/inhouse.min.js' : ['./dist/js/inhouse.js']
				}
			}
		},
		
		concat: {
			dev: {
				files: {
					'./dev/js/vendors.min.js' : getAllVendorLibs()
				}
			},
			dist: {
				files: {
					'./dist/js/vendors.js' : getAllVendorLibs()
				}
			}
		},
		
		copy : {
			dist : {
				files : [
							{
								expand : true,
								cwd : './src',
								src : [
									'**/*.html',
									'**/*.ico',
									'css/**/*.*',
									'font/**/*.*',
									'img/**/*.*',
									'resource/**/*.*'
								],
								dest : './dist'
							}
						]
			},
			dev : {
				files : [
							{
								expand : true,
								cwd : './src',
								src : [
									'**/*.html',
									'**/*.ico',
									'css/**/*.*',
									'font/**/*.*',
									'img/**/*.*',
									'resource/**/*.*'
								],
								dest : './dev'
							}
						]
			}
		},
		
		remove : {
			distJs : {
				fileList : [
								'./dist/js/vendors.js', 
								'./dist/js/inhouse.js'
							]
			},
			cleanDist : {
				dirList : ['dist']
			},
			cleanDev : {
				dirList : ['dev']
			}
		},
		
		connect : {
			server : {
				options : {
					protocol : 'https',
					port : 443,
					open : true,
					base : 'dev',
					hostname: 'x3innovation.github.io',
					key: grunt.file.read('sslcert/server.key').toString(),
			        cert: grunt.file.read('sslcert/server.crt').toString(),
			        ca: grunt.file.read('sslcert/ca.crt').toString()
				}
			}
		},
		
		watch : {
			options : {
				livereload : true
			},
			nonJsJsx : {
				files : [
							'./src/**/*.html',
							'./src/css/**/*.*',
							'./src/img/**/*.*',
							'./src/font/**/*.*'
						],
				tasks : ['copy:gae']
			},
			jsJsx : {
				files : ['./src/js/inhouse/**/*.js', './src/js/inhouse/**/*.jsx'],
				tasks : ['browserify:dev']
			}
		}
		
	});

	// TASK EXECUTIONS
	grunt.registerTask('build-dist', [
	    'remove:cleanDist',
	    'concat:dist',
		'browserify:dist',
        'copy:dist',
        'uglify:dist',
        'remove:distJs'
	]);

	grunt.registerTask('build-dev', [
	    'remove:cleanDev',
        'concat:dev',
        'browserify:dev',
        'copy:dev'
	]);

	grunt.registerTask('serve', 'start the server and preview the app', function(target){
		grunt.task.run(['build-dev']);
		grunt.task.run(['connect', 'watch']);
	});
};