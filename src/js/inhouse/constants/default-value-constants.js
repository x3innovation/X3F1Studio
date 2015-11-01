module.exports = {
	PageTitleValues : {
		PROJECTS_PAGE_TITLE : 'PROJECTS',
		
		PROJECT_PAGE_TITLE : 'PROJECT DETAIL',

		PERSISTENT_DATA_FORM_PAGE_TITLE : 'PERSISTENT DATA DETAIL',
		ENUM_FORM_PAGE_TITLE : 'ENUMERATION DETAIL',
		EVENT_FORM_PAGE_TITLE : 'EVENT DETAIL',
		SNIPPET_FORM_PAGE_TITLE : 'SNIPPET DETAIL'
	},

	NewFileValues : {
		PROJECT_TITLE : 'NewF1Project',
		PROJECT_DESCRIPTION : 'project description',

		PERSISTENT_DATA_TITLE : 'NewPersistentData',
		ENUM_TITLE : 'NewEnum',
		SNIPPET_TITLE : 'NewSnippet',
		EVENT_TITLE : 'NewEvent',

		PERSISTENT_DATA_DESCRIPTION : 'A new persistent data model',
		ENUM_DESCRIPTION : 'A new enum model',
		SNIPPET_DESCRIPTION : 'A new snippet model',
		EVENT_DESCRIPTION : 'A new event model'
	},

	DefaultFieldAttributes : {
		FIELD_NAME : '',
		FIELD_TYPE : 'double',
		FIELD_DESCRIPTION : '',
		FIELD_DEF_VALUE : '',
		FIELD_DEF_DATE_VALUE : '',
		FIELD_DEF_BOOL_VALUE : false,
		FIELD_DEF_CHAR_VALUE : '',
		FIELD_MIN_VALUE : '',
		FIELD_MAX_VALUE : '',
		FIELD_MIN_DATETIME_DATE_VALUE : '',
		FIELD_MIN_DATETIME_TIME_VALUE : '',
		FIELD_MAX_DATETIME_DATE_VALUE : '',
		FIELD_MAX_DATETIME_TIME_VALUE : '',
		FIELD_DEF_DATETIME_DATE_VALUE : '',
		FIELD_DEF_DATETIME_TIME_VALUE : '',
		FIELD_MIN_DATE_VALUE : '',
		FIELD_MAX_DATE_VALUE : '',
		FIELD_MIN_TIME_VALUE : '',
		FIELD_MAX_TIME_VALUE : '',
		FIELD_MIN_STR_LEN : '',
		FIELD_MAX_STR_LEN : '',
		FIELD_REF_ID : 'default',
		FIELD_REF_NAME : '',
		FIELD_REF_TYPE : '',
		FIELD_ENUM_ID : 'default',
		FIELD_ENUM_NAME : '',
		FIELD_ENUM_VALUE : 'default',
		FIELD_READ_ONLY : false,
		FIELD_OPTIONAL : false,
		FIELD_ARRAY : false,
		FIELD_ARRAY_LEN : '1',
		FIELD_CONTEXT_ID : false
	},

	DefaultQueryAttributes : {
		QUERY_NAME : '',
		QUERY_DESCRIPTION : ''
	},

	HeaderBarDefaultFields: {
		LENGTH: {name: 'length', size: 4},
		TYPE_ID: {name: 'type id', size: 4},
		VERSION: {name: 'version', size: 4},
		EXISTS_FLAG: {name: 'exists flag', size: 4},
		ENCODING: {name: 'encoding', size: 4},
		CHECKSUM: {name: 'checksum', size: 8},
		UUID_LOW: {name: 'uuid(low)', size: 8},
		UUID_HIGH: {name: 'uuid(high)', size: 8}
	},

	FieldSizeValues : {
		DMX_HEADER_SIZE : 44,

		BYTE_SIZE : 1,
		SHORT_SIZE : 2,
		INTEGER_SIZE : 4,
		LONG_SIZE : 8,
		FLOAT_SIZE : 4,
		DOUBLE_SIZE : 8,
		STRING_SIZE : 0, //Plus the length of the string

		DATE_SIZE : 8,
		DATETIME_SIZE: 8,
		TIME_SIZE: 8,

		BOOLEAN_SIZE : 1,
		ENUM_SIZE : 4,
		REF_SIZE : 16,

		NULLBITS_SIZE : 4,

		POINTER_SIZE : 4,
		SEQUENCE_SIZE : 4
	}
};