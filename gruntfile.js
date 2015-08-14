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
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	// EVENT HANDLERS
	grunt.event.on('watch', function(action, filepath, target){
		grunt.log.writeln('');
		grunt.log.writeln(filepath + ' has ' + action);
		grunt.log.writeln('');
	});

	// TASKS DEFINITIONS
	function getAllVendorJsLibs()
	{
		var vendorLibs = [
			'jquery-2.1.3.js',
			'jquery-ui-1.11.3.js',
			'react-with-addons-0.12.2.min.js',
			'vkbeautify-0.99.00.js',
			'highlight-8.6.js',
			'materialize-0.96.1.js',
			'react-router-0.11.6.js',
			'bullet-1.1.3-Jimin.js',
			'jquery.tooltipster-3.3.0.js',
			'store-1.3.17.js',
			'x2js-1.1.7.js',
			'anijs-0.9.2.js',
			'jquery.slimscroll-1.3.0.js',
			'jquery.flip-1.0.0.js',
			'autosize-2.0.0.js',
			'jquery.dataTables-1.10.7.js',
			'jquery-1.10.7.js'
		];

		for (var i = 0; i<vendorLibs.length; ++i)
		{
			vendorLibs[i] = './src/js/vendors/' + vendorLibs[i];
		}

		return vendorLibs;
	}

	function getAllVendorCss()
	{
		var vendorCss = [
			'materialize-0.96.1.css',
			'jquery.tooltipster-3.3.0.css',
			'jquery.dataTables-1.10.7.css',
			'highlight-8.6.css'
		];

		for (var i = 0; i<vendorCss.length; ++i)
		{
			vendorCss[i] = './src/css/vendors/' + vendorCss[i];
		}

		return vendorCss;
	}

	function getAllInhouseCss()
	{
		var inhouseCss = [
			'main.css',
			'nav-bar.css',
			'card.css',
			'xml-generator.css',
			'entry-forms/common.css',
			'entry-forms/enum-elements.css',
			'entry-forms/field-selector.css',
			'entry-forms/form.css',
			'entry-forms/form-header-bar.css',
			'entry-forms/header.css',
			'entry-forms/persistent-events.css',
			'entry-forms/queries.css',
			'project/project.css'
		];

		for (var i = 0; i<inhouseCss.length; ++i)
		{
			inhouseCss[i] = './src/css/inhouse/' + inhouseCss[i];
		}

		return inhouseCss;
	}
	
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
			distVendorCss : {
				files : {
					'./dist/css/vendors.css' : getAllVendorCss()
				}
			},
			distInhouseCss : {
				files : {
					'./dist/css/inhouse.css' : getAllInhouseCss()
				}
			},
			distJs : {
				files : {
					'./dist/js/vendors.js' : getAllVendorJsLibs()
				}
			},
			devVendorCss : {
				files : {
					'./dev/css/vendors.min.css' : getAllVendorCss()
				}
			},
			devInhouseCss : {
				files : {
					'./dev/css/inhouse.min.css' : getAllInhouseCss()
				}
			},
			devJs : {
				files : {
					'./dev/js/vendors.min.js' : getAllVendorJsLibs()
				}
			}
		},
		
		cssmin: {
			target : {
				files : {
					'./dist/css/vendors.min.css' : ['./dist/css/vendors.css'],
					'./dist/css/inhouse.min.css' : ['./dist/css/inhouse.css']
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
									'font/**/*.*',
									'img/**/*.*',
									'resource/**/*.*',
									'*.js' // temporary for google drive examples
								],
								dest : './dev'
							}
						]
			}
		},
		
		remove : {
			distVendorCss : {
				fileList : ['./dist/css/vendors.css']
			},
			distInhouseCss : {
				fileList : ['./dist/css/inhouse.css']
			},
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
			miscellaneous : {
				files : [
							'./src/**/*.html',
							'./src/img/**/*.*',
							'./src/font/**/*.*'
						],
				tasks : ['copy:dev']
			},
			jsJsx : {
				files : ['./src/js/inhouse/**/*.js', './src/js/inhouse/**/*.jsx'],
				tasks : ['browserify:dev']
			},
			css : {
				files : ['./src/css/inhouse/**/*.*'],
				tasks : ['concat:devInhouseCss']
			}
		}
		
	});

	// TASK EXECUTIONS
	grunt.registerTask('build-dist', [
		'remove:cleanDist',
		'concat:distVendorCss',
		'concat:distInhouseCss',
		'cssmin',
		'concat:distJs',
		'browserify:dist',
		'copy:dist',
		'uglify:dist',
		'remove:distVendorCss',
		'remove:distInhouseCss',
		'remove:distJs'
	]);

	grunt.registerTask('build-dev', [
		'remove:cleanDev',
		'concat:devVendorCss',
		'concat:devInhouseCss',
		'concat:devJs',
		'browserify:dev',
		'copy:dev'
	]);

	grunt.registerTask('serve', 'start the server and preview the app', function(target){
		grunt.task.run(['build-dev']);
		grunt.task.run(['connect', 'watch']);
	});
};