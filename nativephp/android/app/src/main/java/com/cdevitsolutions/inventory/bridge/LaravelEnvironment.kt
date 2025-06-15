package com.cdevitsolutions.inventory.bridge

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import com.google.firebase.messaging.FirebaseMessaging
import java.io.File
import java.io.FileOutputStream
import java.io.BufferedInputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

class LaravelEnvironment<InputStream>(private val context: Context) {
    private val appStorageDir = context.getDir("storage", Context.MODE_PRIVATE)
    private val phpBridge = PHPBridge(context)
    var cachedFcmToken: String? = null


    private external fun nativeSetEnv(name: String, value: String, overwrite: Int): Int
    private val preservePaths = listOf(
        "storage/app",
        "storage/logs",
        "storage/framework/cache",
        "storage/framework/sessions",
        "storage/framework/views",
    )

    companion object {
        private const val TAG = "LaravelEnvironment"

        init {
            System.loadLibrary("php_wrapper")
        }
    }

    fun initialize() {
        try {
            setupDirectories()
            extractLaravelBundle()
            setupEnvironment()
            runBaseArtisanCommands()
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Laravel environment", e)
            throw RuntimeException("Failed to initialize Laravel environment", e)
        }
    }

    private fun extractLaravelBundle() {

        val laravelDir = File(appStorageDir, "laravel")
        val extractedVersionFile = File(laravelDir, ".version")

        val embeddedVersion = readVersionFromZip("laravel_bundle.zip")
        val currentVersion = if (extractedVersionFile.exists()) extractedVersionFile.readText() else null

        if (embeddedVersion == null) {
            Log.e(TAG, "❌ Couldn't read .version from laravel_bundle.zip")
            return
        }

        val isDebugOverride = currentVersion == "DEBUG"
        val isUpToDate = currentVersion == embeddedVersion

        if (!isDebugOverride && isUpToDate) {
            Log.d(TAG, "✅ Laravel already up to date (version $embeddedVersion)")
            return
        }

        Log.d(TAG, "📦 Extracting Laravel bundle (new version: $embeddedVersion)")
        Log.d(TAG, "📦 Extracting current: $currentVersion")
        Log.d(TAG, "📦 Extracting embedded: $embeddedVersion")

        if (laravelDir.exists()) {
            deleteDirectoryContentsExcept(laravelDir, preservePaths)
        } else {
            laravelDir.mkdirs()
        }

        try {
            val zipStream = context.assets.open("laravel_bundle.zip")
            unzip(zipStream, laravelDir)

            // Save the new version after successful extraction
            extractedVersionFile.writeText(embeddedVersion)

            Log.d(TAG, "✅ Extraction complete to ${laravelDir.absolutePath}")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to extract Laravel zip", e)
        }
    }

    private fun readVersionFromZip(zipFileName: String): String? {
        return try {
            val zis = ZipInputStream(context.assets.open(zipFileName) as java.io.InputStream)
            var entry: ZipEntry?

            while (zis.nextEntry.also { entry = it } != null) {
                if (entry?.name == ".version") {
                    return zis.bufferedReader().readText().trim()
                }
            }

            null
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error reading .version from zip", e)
            null
        }
    }

    private fun unzip(inputStream: java.io.InputStream, destinationDir: File) {
        val buffer = ByteArray(4096)
        val zis = ZipInputStream(BufferedInputStream(inputStream))


        var ze: ZipEntry? = zis.nextEntry
        while (ze != null) {
            val file = File(destinationDir, ze.name)

            if (ze.isDirectory) {
                file.mkdirs()
            } else {
                file.parentFile?.mkdirs()
                FileOutputStream(file).use { fos ->
                    var count: Int
                    while (zis.read(buffer).also { count = it } != -1) {
                        fos.write(buffer, 0, count)
                    }
                }
            }
            zis.closeEntry()
            ze = zis.nextEntry
        }
        zis.close()
    }

    private fun copyAssetToInternalStorage(assetName: String, targetFileName: String): File {
        val outFile = File(context.filesDir, targetFileName)
        if (!outFile.exists()) {
            context.assets.open(assetName).use { input ->
                FileOutputStream(outFile).use { output ->
                    input.copyTo(output)
                }
            }
        }
        return outFile
    }

    private fun deleteDirectoryContentsExcept(directory: File, preservePaths: List<String>) {
        if (!directory.exists() || !directory.isDirectory) return

//        Log.d("TEST", "Base directory: ${directory.absolutePath}")
//        Log.d("TEST", "Paths to preserve: $preservePaths")

        directory.listFiles()?.forEach { file ->
            val relativePath = file.absolutePath.substring(directory.absolutePath.length + 1)
//            Log.d("TEST", "Checking file: $relativePath")

            // First, check if this is a top-level directory that we want to selectively preserve
            if (file.isDirectory && preservePaths.any { it.startsWith("$relativePath/") }) {
                // This is a directory that contains paths we want to preserve
//                Log.d("TEST", "Directory $relativePath contains paths to preserve")

                // Get the list of subpaths to preserve within this directory
                val subPreservePaths = preservePaths
                    .filter { it.startsWith("$relativePath/") }
                    .map { it.substring(relativePath.length + 1) }

//                Log.d("TEST", "Recursive preservation for $relativePath with paths: $subPreservePaths")
                deleteDirectoryContentsExcept(file, subPreservePaths)
            }
            // Otherwise, check if this exact path should be preserved
            else {
                val shouldPreserve = preservePaths.any { preservePath ->
                    relativePath == preservePath
                }

//                Log.d("TEST", "Should preserve $relativePath: $shouldPreserve")

                if (!shouldPreserve) {
                    if (file.isDirectory) {
//                        Log.d("TEST", "Deleting directory: $relativePath")
                        file.deleteRecursively()
                    } else {
//                        Log.d("TEST", "Deleting file: $relativePath")
                        file.delete()
                    }
                } else {
//                    Log.d("TEST", "Preserving: $relativePath")
                }
            }
        }
    }

    private fun runBaseArtisanCommands() {
        val dbFile = File(appStorageDir, "persisted_data/database/database.sqlite")
        if (!dbFile.exists()) {
            Log.d(TAG, "📄 Creating empty SQLite file: ${dbFile.absolutePath}")
            dbFile.createNewFile()
        } else {
            Log.d(TAG, "✅ SQLite file already exists: ${dbFile.absolutePath}")
        }

        phpBridge.runArtisanCommand("config:clear")
        phpBridge.runArtisanCommand("clear-compiled")
        phpBridge.runArtisanCommand("optimize:clear")
        phpBridge.runArtisanCommand("config:cache")
        phpBridge.runArtisanCommand("route:clear")
        phpBridge.runArtisanCommand("view:clear")
        phpBridge.runArtisanCommand("cache:clear")
        val migrate = phpBridge.runArtisanCommand("migrate --force")
        Log.d(TAG, "✅ Migration result: $migrate")
    }

    @SuppressLint("SetWorldReadable", "SetWorldWritable")
    private fun setupDirectories() {
        try {
            createDirectory("persisted_data/storage/framework")
            createDirectory("persisted_data/storage/framework/views")
            createDirectory("persisted_data/storage/framework/sessions")
            createDirectory("persisted_data/storage/framework/cache")
            createDirectory("persisted_data/storage/logs")
            createDirectory("persisted_data/database/")

            val sessionsDir = File(appStorageDir, "persisted_data/storage/framework/sessions")
            sessionsDir.setExecutable(true, false) // Add execute permission too
            sessionsDir.setWritable(true, false)
            sessionsDir.setReadable(true, false)

            File(appStorageDir, "persisted_data/storage").setWritable(true, false)
            File(appStorageDir, "persisted_data/storage/framework").setWritable(true, false)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to create directories", e)
            throw e
        }
    }

    private fun setupEnvironment() {
        try {
            val appKeyFile = File(appStorageDir, "persisted_data/appkey.txt")
            val appKey: String = if (appKeyFile.exists()) {
                val contents = appKeyFile.readText().trim()
                if (contents.startsWith("base64:")) {
                    Log.d(TAG, "✅ Found valid APP_KEY in file")
                    contents
                } else {
                    Log.w(TAG, "⚠️ Found invalid APP_KEY in file, regenerating...")
                    appKeyFile.delete()
                    generateAndSaveAppKey(appKeyFile)
                }
            } else {
                generateAndSaveAppKey(appKeyFile)
            }

            setEnvironmentVariable("APP_KEY", appKey)
            Log.d(TAG, "✅ Found existing APP_KEY $appKey")

            // Core Laravel paths
            // setEnvironmentVariable("APP_NAME", "laravel")
            setEnvironmentVariable("DOCUMENT_ROOT", "${appStorageDir.absolutePath}/laravel")
            setEnvironmentVariable("LARAVEL_BASE_PATH", "${appStorageDir.absolutePath}/laravel")
            setEnvironmentVariable("COMPOSER_VENDOR_DIR", "${appStorageDir.absolutePath}/laravel/vendor")
            setEnvironmentVariable("COMPOSER_AUTOLOADER_PATH", "${appStorageDir.absolutePath}/laravel/vendor/autoload.php")

            // Laravel storage paths
            setEnvironmentVariable("LARAVEL_STORAGE_PATH", "${appStorageDir.absolutePath}/persisted_data/storage")
            setEnvironmentVariable("LARAVEL_BOOTSTRAP_PATH", "${appStorageDir.absolutePath}/laravel/bootstrap")
            setEnvironmentVariable("VIEW_COMPILED_PATH", "${appStorageDir.absolutePath}/persisted_data/storage/framework/views")

            // Laravel environment settings
            setEnvironmentVariable("APP_ENV", "local")
            setEnvironmentVariable("APP_DEBUG", "true")
            setEnvironmentVariable("APP_URL", "http://127.0.0.1")
            setEnvironmentVariable("ASSET_URL", "http://127.0.0.1/_assets")
            setEnvironmentVariable("DB_CONNECTION", "sqlite")
            setEnvironmentVariable("DB_DATABASE", "${appStorageDir.absolutePath}/persisted_data/database/database.sqlite")
            setEnvironmentVariable("CACHE_DRIVER", "file")
            setEnvironmentVariable("CACHE_STORE", "file")
            setEnvironmentVariable("QUEUE_CONNECTION", "sync")

            setEnvironmentVariable("COOKIE_PATH", "/")
            setEnvironmentVariable("COOKIE_DOMAIN", "127.0.0.1")
            setEnvironmentVariable("COOKIE_SECURE", "false")
            setEnvironmentVariable("COOKIE_HTTP_ONLY", "true")

            // Session
            setEnvironmentVariable("SESSION_DRIVER", "file")
            setEnvironmentVariable("SESSION_DOMAIN", "127.0.0.1")
            setEnvironmentVariable("SESSION_SECURE_COOKIE", "false")
            setEnvironmentVariable("SESSION_HTTP_ONLY", "true")
            setEnvironmentVariable("SESSION_SAME_SITE", "lax")

            // PHP paths and settings
            setEnvironmentVariable("PHP_INI_SCAN_DIR", appStorageDir.absolutePath)
            setEnvironmentVariable("CA_CERT_DIR", context.filesDir.absolutePath)
            setEnvironmentVariable("PHPRC", context.filesDir.absolutePath)

            // PHP/Server environment
            setEnvironmentVariable("REMOTE_ADDR", "127.0.0.1")
            setEnvironmentVariable("SERVER_NAME", "127.0.0.1")
            setEnvironmentVariable("SERVER_PORT", "80")
            setEnvironmentVariable("SERVER_PROTOCOL", "HTTP/1.1")
            setEnvironmentVariable("REQUEST_SCHEME", "http")

            val phpSessionDir = File(appStorageDir, "php_sessions").apply {
                mkdirs()
                setReadable(true, false)
                setWritable(true, false)
                setExecutable(true, false)
            }
            setEnvironmentVariable("SESSION_SAVE_PATH", phpSessionDir.absolutePath)
            Log.d(TAG, "PHP session path set to: ${phpSessionDir.absolutePath}")

            try {
                copyAssetToInternalStorage("cacert.pem", "cacert.pem")
                val phpIni = """
curl.cainfo="${context.filesDir.absolutePath}/cacert.pem"
openssl.cafile="${context.filesDir.absolutePath}/cacert.pem"
"""
                File(context.filesDir, "php.ini").writeText(phpIni)
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to copy or set CURL_CA_BUNDLE", e)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Failed to setup environment", e)
            throw e
        }
    }

    private fun generateAndSaveAppKey(file: File): String {
        val result = phpBridge.runArtisanCommand("key:generate --show")
        val generatedKey = result.trim()

        if (!generatedKey.startsWith("base64:")) {
            throw RuntimeException("Failed to generate APP_KEY, got: '$generatedKey'")
        }

        file.parentFile?.mkdirs()
        file.writeText(generatedKey)

        Log.d(TAG, "🔐 Generated and stored new APP_KEY: $generatedKey")
        return generatedKey
    }

    private fun setEnvironmentVariable(name: String, value: String) {
        try {
            val result = nativeSetEnv(name, value, 1)
            if (result != 0) {
                throw RuntimeException("Failed to set environment variable: $name")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set environment variable: $name", e)
            throw e
        }
    }

    private fun createDirectory(path: String) {
        File(appStorageDir, path).mkdirs()
    }

    fun cleanup() {
        try {
            phpBridge.shutdown()
        } catch (e: Exception) {
            Log.e(TAG, "Error during cleanup", e)
        }
    }
}