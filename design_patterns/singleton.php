<?php

/**
 * Singleton allows object to be loaded only once, useful for stuff like database, session, configs etc
 */
final class DatabaseConfig
{
    /** Declaring class properties or methods as static makes them accessible without needing an instantiation of the class. */
    protected static $instance = null;

    /** Prevent from prevent from creating multiple instances (cant call new DatabaseConfig() on a private constructor) */
    private function __construct()
    {
    }

    /** Prevent the instance from being cloned (which would create a second instance of it) */
    private function __clone()
    {
    }

    public static function createInstance()
    {
        if (static::$instance === null) {
            static::$instance = new static();
        }

        return static::$instance;
    }
}

$instance1 = DatabaseConfig::createInstance();
$instance2 = DatabaseConfig::createInstance();

var_dump($instance1);
var_dump($instance2);
