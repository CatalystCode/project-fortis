module.exports = {
    translator: {
        translationServiceTokenHost: process.env.TRANSLATION_SERVICE_TOKEN_HOST || 'https://api.cognitive.microsoft.com',
        translationServiceTranslatorHost: process.env.TRANSLATION_SERVICE_TRANSLATOR_HOST || 'https://api.microsofttranslator.com',
    },
    serviceBus: {
        fortisSbConfigQueue: process.env.FORTIS_SB_CONFIG_QUEUE || 'configuration',
        fortisSbCommandQueue: process.env.FORTIS_SB_COMMAND_QUEUE || 'command',
        fortisSbConnStr: process.env.FORTIS_SB_CONN_STR
    },
    storage: {
        fortisCentralAssetsHost: process.env.FORTIS_CENTRAL_ASSETS_HOST || 'https://fortiscentral.blob.core.windows.net',
        userFilesBlobAccountName: process.env.USER_FILES_BLOB_ACCOUNT_NAME,
        userFilesBlobAccountKey: process.env.USER_FILES_BLOB_ACCOUNT_KEY
    },
    facebook: {
        facebookAuthToken: process.env.FACEBOOK_AUTH_TOKEN,
        facebookApiHost: process.env.FACEBOOK_API_HOST || 'https://graph.facebook.com',
        facebookApiVersion: process.env.FACEBOOK_API_VERSION || 'v2.9'
    },
    eventHub: {
        publishEventsEventhubConnectionString: process.env.PUBLISH_EVENTS_EVENTHUB_CONNECTION_STRING,
        publishEventsEventhubPath: process.env.PUBLISH_EVENTS_EVENTHUB_PATH,
        publishEventsEventhubPartition: process.env.PUBLISH_EVENTS_EVENTHUB_PARTITION
    },
    cassandra: {
        fetchSize: process.env.FETCH_SIZE || 1000,
        maxOperationsPerBatch: process.env.MAX_OPERATIONS_PER_BATCH || 10,
        maxConcurrentBatches: process.env.MAX_CONCURRENT_BATCHES || 50,
        coreConnectionsPerHostLocal: process.env.CORE_CONNECTIONS_PER_HOST_LOCAL || 3,
        coreConnectionsPerHostRemote: process.env.CORE_CONNECTIONS_PER_HOST_REMOTE || 1,
        cassandraKeyspace: process.env.CASSANDRA_KEYSPACE,
        cassandraContactPoints: process.env.CASSANDRA_CONTACT_POINTS,
        cassandraUsername: process.env.CASSANDRA_USERNAME,
        cassandraPassword: process.env.CASSANDRA_PASSWORD
    },
    featureService: {
        fortisFeatureServiceHost: process.env.FORTIS_FEATURE_SERVICE_HOST,
    },
    appinsights: {
        appinsightsInstrumentationkey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    },
    server: {
        enableV2: process.env.ENABLE_V2,
        port: process.env.PORT || 8000
    }
};
