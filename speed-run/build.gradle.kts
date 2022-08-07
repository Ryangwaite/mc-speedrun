val ktor_version: String by project
val kotlin_version: String by project
val logback_version: String by project

plugins {
    application
    kotlin("jvm") version "1.6.20"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.6.20"
}

// Junit Jupiter is imported so need to explicitly set to use JUnit platform
tasks.withType<Test> {
    useJUnitPlatform()
}

// Compile all Kotlin code to JVM 1.8 bytecode...
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    sourceCompatibility = JavaVersion.VERSION_1_8.toString()
    targetCompatibility = JavaVersion.VERSION_1_8.toString()
    kotlinOptions.jvmTarget = "1.8"
}
// ...and the same for Java code
tasks.withType<JavaCompile> {
    sourceCompatibility = JavaVersion.VERSION_1_8.toString()
    targetCompatibility = JavaVersion.VERSION_1_8.toString()
}

group = "com.ryangwaite"
version = "0.0.1"
application {
    mainClass.set("com.ryangwaite.ApplicationKt")
}

repositories {
    mavenCentral {
        content {
            // Maven central has a directory for resolving javax.jms:jms:1.1, however
            // there's no .jar present and gradle gives up at that point without checking
            // the jboss repo below. The following line turns off searching the module
            // for this repo to avoid the problem.
            excludeModule("javax.jms", "jms")
        }
    }
    // To resolve javax.jms:jms:1.1
    maven {
        url = uri("https://repository.jboss.org/maven2")
    }
}

dependencies {
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")
    implementation("io.ktor:ktor-server-netty:$ktor_version")
    implementation("io.ktor:ktor-server-websockets:$ktor_version")
    implementation("io.ktor:ktor-server-cors:$ktor_version")
    implementation("io.ktor:ktor-server-auth:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jwt:$ktor_version")
    implementation("ch.qos.logback:logback-classic:$logback_version")
    implementation("org.redisson:redisson:3.17.0")
    implementation("com.rabbitmq:amqp-client:5.14.2")
    implementation("com.rabbitmq.jms:rabbitmq-jms:2.5.0")
    implementation("software.amazon.awssdk:sdk-core:2.17.247")
    implementation("software.amazon.awssdk:sqs:2.17.247")
    implementation("com.amazonaws:amazon-sqs-java-messaging-lib:2.0.0")
    implementation("io.reactivex.rxjava3:rxjava:3.1.4")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-rx3:1.6.1-native-mt")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")

    testImplementation("io.ktor:ktor-server-tests:$ktor_version")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.6.1-native-mt")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit:$kotlin_version")
    testImplementation("org.junit.jupiter:junit-jupiter:5.8.2")
    testImplementation("io.mockk:mockk:1.12.3")
    testImplementation("joda-time:joda-time:2.10.14")
}