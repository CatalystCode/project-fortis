#!/bin/bash
echo
echo "Checking your current system for Fortis compatability:"
echo
echo "Validating java version and jdk..........................................-"

if type -p java; then
    echo found java executable in PATH
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    echo PASS: found java executable in JAVA_HOME     
    _java="$JAVA_HOME/bin/java"
else
    echo "java was not found on your machine"
fi

if [[ "$_java" ]]; then
    version=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $2}')
    echo version: "$version"
    if [[ "$version" > "1.8" ]]; then
        echo PASS: version is more than 1.8
    else         
        echo WARN: version is less than 1.8
    fi
fi

if [[ "$_java" ]]; then
    versionJ=$("$_java" -version 2>&1 | awk -F '"' '/version/ {print $1}')
    echo your machine is running: "$versionJ"
    if [[ "$versionJ" == "java version " ]]; then
        echo WARN: java version is running the incorrect jdk package, we recommend installing openJDK
    elif [[ "$versionJ" == "openjdk version " ]]; then
        echo PASS: you are running the correct openJDK version
    else         
        echo WARN: detected unknown jdk package, please install openJDK
    fi
fi
echo "Validating jdk...........................................-"
if type -p javac; then
    echo PASS: found javac executable in PATH
    _javac=javac
elif [[ -n "$JAVAC_HOME" ]] && [[ -x "$JAVAC_HOME/bin/javac" ]];  then
    echo PASS: found javac executable in JAVAC_HOME     
    _javac="$JAVAC_HOME/bin/javac"
else
    echo FAIL: "javac was not found on your machine"
fi
#----------------------------------------------------------------------------------

echo
echo "Validating maven..........................................-"

if type -p mvn; then
    echo PASS: found maven executable in PATH
    _mvn=mvn
elif [[ -n "$MAVEN_HOME" ]] && [[ -x "$MAVEN_HOME/bin/mvn" ]];  then
    echo found mvn executable in MAVEN_HOME     
    _javac="$MAVEN_HOME/bin/mvn"
else
    echo "FAIL: maven was not found on your system"
fi

if [[ "$_mvn" ]]; then
    version=$("$_mvn" -version 1>&1 | awk -F '"' '/Apache/ {print $0}')
    echo version "$version"
    versionNumb=$(echo "$version" | awk '{if(/Maven /) print $3}')
    if [[ "$version" > "3.0" ]]; then
        echo PASS: Apache Maven version is more than 3.0
    else         
        echo WARN: Apache Maven version is less than 3.0. Please Update.
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating nodejs..........................................-"

if type -p nodejs; then
    echo PASS: found nodejs executable in PATH
    _nodejs=nodejs
else
    echo "FAIL: nodejs was not found on your machine"
fi

if [[ "$_nodejs" ]]; then
    version=$("$_nodejs" -v 2>&1 | tr -d 'v')
    echo version: "$version"
    if [[ "$version" > "4.0" ]]; then
        echo PASS: nodejs version is more than 4.0
    else         
        echo WARN: nodejs version is less than 4.0
    fi
fi
if type -p npm; then
    echo PASS: found npm executable in PATH
    _npm=npm
else
    echo "FAIL: npm was not found on your machine"
fi

if [[ "$_npm" ]]; then
    version=$("$_npm" -v )
    echo version: "$version"
    if [[ "$version" > "3.0" ]]; then
        echo PASS: npm version is more than 3.0
    else         
        echo WARN: npm version is less than 3.0
    fi
fi
#----------------------------------------------------------------------------------


echo
echo "Validating scala..........................................-"

if type -p scala; then
    echo PASS: found scala executable in PATH
    _scala=scala
else
    echo "FAIL: scala was not found on your machine."
fi

if [[ "$_scala" ]]; then
    version=$("$_scala" -version 2>&1 | awk -F ' ' '{print $5}')
    echo version: "$version"
    if [[ "$version" > "2.7" ]]; then
        echo PASS: scala version is more than 2.7
    else         
        echo WARN: scala version is less than 2.0 ####FAILING need to fix
    fi
fi

#----------------------------------------------------------------------------------


echo
echo "Validating sbt..........................................-"

if type -p sbt; then
    echo PASS: found sbt directory in PATH
    _sbt=sbt
    echo Checking fortis project sbt version.... $(sbt sbtVersion)
else
    echo "FAIL: sbt was not found on your machine."
fi

#----------------------------------------------------------------------------------

echo
echo "Validating cassandra..........................................-"

if type -p cassandra; then
    echo PASS: found sbt directory in PATH
    _cassandra=cassandra
else
    echo "FAIL: cassandra was not found on your machine."
fi


if [[ "$_cassandra" ]]; then
    version=$("$_cassandra" -v )
    echo version: "$version"
    if [[ "$version" > "3.0" ]]; then
        echo PASS: cassandra version is more than 3.0
    else         
        echo WARN: cassandra version is less than 3.0
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating spark..........................................-"

if type -p spark-shell; then
    echo PASS: found spark-shell executable in PATH
    _sparkshell=spark-shell
else
    echo "WARN: spark path was not found on your machine. Please validate you have added path to spark directory using SPARK_HOME"
fi

if [[ "$_sparkshell" ]]; then
    version=$(echo "$SPARK_MAJOR_VERSION")
    echo version: "$version"
    if [[ "$version" = "2" ]]; then
        echo PASS: spark-shell version is more than 2.0
    else         
        echo WARN: spark-shell version is less than 2.0
    fi
fi

#----------------------------------------------------------------------------------

echo
echo "Validating kubectl..........................................-"

if kubectl cluster-info; then
    echo PASS: found kubectl exe in local shared path
    _kubectl=kubectl
else
    echo "WARN: kubectl path was not found on your machine. Please validate you have installed kubectl correctly"
fi

#----------------------------------------------------------------------------------
echo
echo "Validating helm..........................................-"

if type -p helm; then
    echo PASS: found helm exe in local shared path
    _khelm=helm
else
    echo "WARN: helm path was not found on your machine. Please validate you have installed helm correctly"
fi