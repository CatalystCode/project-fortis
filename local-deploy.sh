#!/usr/bin/env bash

# Version Control Center - The following variables are updated to specify the dependency versions Fortis is currentl running on.
#       For Example: minJava is the minimum Java version required at time of publish. Currently it is 1.7.0 which this script removes decimals
#       for arithmetic analysis when validating your machine's Jdk version. - Updated 10.25.2017
minJava=170
minMaven=300
minNode=400
minNpm=300
minScala=270
minCassandra=300
minSpark=2

# Function that converts version command output to version digits for arithmetic compare
to_major_version() { echo "${1}" | sed -e 's/[A-Za-z ._-]//g'| awk '{print substr($0,0,3)}'; }

#Function that verifies path to dependency command is properly located
command_exists() { command -v "$1" >/dev/null 2>&1; }



#----------------------------------------------------------------------------------
echo "Checking your current system for Fortis compatability:"
echo
echo "Validating JAVA version and jdk...........................-"

if command_exists java; then
    echo "Found JAVA executable in PATH"
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    echo "PASS: Found JAVA executable in JAVA_HOME"   
    _java="$JAVA_HOME/bin/java"
else
    echo "JAVA was not found on your machine"
fi

if [[ "$_java" ]]; then
    version=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $2}')
    vCompare_java=$(to_major_version ${version})
    echo "version: "$version""
    if (( $(echo "$vCompare_java" "$minJava" | awk '{print ($1 > $2)}') )); then
        echo "PASS: JAVA version is 1.8 or greater"
    else         
        echo "WARN: JAVA version is less than 1.8"
    fi
fi

if [[ "$_java" ]]; then
    versionJ=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $1}')
    echo "Your machine is running: "$versionJ""
    if [[ "$versionJ" == "java version " ]]; then
        echo "WARN: java version is running the incorrect jdk package, we recommend installing openJDK"
    elif [[ "$versionJ" == "openjdk version " ]]; then
        echo "PASS: you are running the correct openJDK version"
    else         
        echo "WARN: detected unknown jdk package, please install openJDK"
    fi
fi
echo "Validating jdk...........................................-"
if command_exists javac; then
    echo "PASS: found javac executable in PATH"
elif [[ -n "$JAVAC_HOME" ]] && [[ -x "$JAVAC_HOME/bin/javac" ]];  then
    echo "PASS: found javac executable in JAVAC_HOME"
else
    echo "FAIL: javac was not found on your machine"
fi
#----------------------------------------------------------------------------------

echo
echo "Validating maven..........................................-"

if command_exists mvn; then
    echo "PASS: found maven executable in PATH"
    _mvn=mvn
elif [[ -n "$MAVEN_HOME" ]] && [[ -x "$MAVEN_HOME/bin/mvn" ]];  then
    echo "Found mvn executable in MAVEN_HOME"
else
    echo "FAIL: maven was not found on your system"
fi

if [[ "$_mvn" ]]; then
    version=$("$_mvn" -version 1>&1 | awk -F '"' '/Apache/ {print $0}')
    vCompare_mvn=$(to_major_version "${version}")
    echo "version: "$version""
    if (( $(echo "$vCompare_mvn" "$minMaven" | awk '{print ($1 > $2)}') )); then
        echo "PASS: Apache Maven version is more than 3.0"
    else         
        echo "WARN: Apache Maven version is less than 3.0. Please Update."
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating nodejs..........................................-"

if command_exists nodejs; then
    echo "PASS: found nodejs executable in PATH"
    _nodejs=nodejs
else
    echo "FAIL: nodejs was not found on your machine"
fi

if [[ "$_nodejs" ]]; then
    version=$("$_nodejs" -v 2>&1 | tr -d 'v')
    vCompare_node=$(to_major_version "${version}")
    echo "version: "$version""
    if (( $(echo "$vCompare_node" "$minNode" | awk '{print ($1 > $2)}') )); then
        echo "PASS: nodejs version is more than 4.0"
    else         
        echo "WARN: nodejs version is less than 4.0"
    fi
fi
if command_exists npm; then
    echo "PASS: found npm executable in PATH"
    _npm=npm
else
    echo "FAIL: npm was not found on your machine"
fi

if [[ "$_npm" ]]; then
    version=$("$_npm" -v )
    echo "version: "$version""
    vCompare_npm=$(to_major_version "${version}")
    if (( $(echo "$vCompare_npm" "$minNpm" | awk '{print ($1 > $2)}') )); then
        echo "PASS: npm version is more than 3.0"
    else         
        echo "WARN: npm version is less than 3.0"
    fi
fi
#----------------------------------------------------------------------------------


echo
echo "Validating scala..........................................-"

if command_exists scala; then
    echo "PASS: found scala executable in PATH"
    _scala=scala
else
    echo "FAIL: scala was not found on your machine."
fi

if [[ "$_scala" ]]; then
    version=$("$_scala" -version 2>&1 | cut -d' ' -f5)
    echo "version: "$version""
    vCompare_scala=$(to_major_version "${version}")
    if (("$vCompare_scala" > "$minScala")); then
        echo "PASS: scala version is more than 2.7"
    else         
        echo "WARN: scala version is less than 2.7" 
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating sbt..........................................-"

if command_exists sbt; then
    echo "PASS: found sbt directory in PATH"
    echo "Checking fortis project sbt version.... "$(sbt sbtVersion)""
else
    echo "FAIL: sbt was not found on your machine."
fi

#----------------------------------------------------------------------------------

echo
echo "Validating cassandra..........................................-"

if command_exists -p cassandra; then
    echo "PASS: found sbt directory in PATH"
    _cassandra=cassandra
else
    echo "FAIL: cassandra was not found on your machine."
fi


if [[ "$_cassandra" ]]; then
    version=$("$_cassandra" -v )
    echo "version: "$version""
    vCompare_cassandra=$(to_major_version "${version}")
    if (( "$vCompare_cassandra" > "$minCassandra" )); then
        echo "PASS: cassandra version is more than 3.0"
    else         
        echo "WARN: cassandra version is less than 3.0"
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating spark..........................................-"

if command_exists spark-shell; then
    echo "PASS: found spark-shell executable in PATH"
    _sparkshell=spark-shell
else
    echo "WARN: spark path was not found on your machine. Please validate that you have added spark directory to path using SPARK_HOME"
fi

if [[ "$_sparkshell" ]]; then
    version=$("${SPARK_MAJOR_VERSION}")
    echo "version: "$version""
    if [[ "$version" == "$minSpark" ]]; then
        echo "PASS: spark-shell version is more than 2.0"
    else         
        echo "WARN: spark-shell version is less than 2.0"
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating kubectl..........................................-"

if kubectl cluster-info; then
    echo "PASS: found kubectl exe in local shared path"
else
    echo "WARN: kubectl path was not found on your machine. Please validate you have installed kubectl correctly"
fi

#----------------------------------------------------------------------------------
echo
echo "Validating helm..........................................-"

if command_exists helm; then
    echo "PASS: found helm exe in local shared path"
else
    echo "WARN: helm path was not found on your machine. Please validate you have installed helm correctly"
fi