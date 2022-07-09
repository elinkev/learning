<?php

/**
 * self refers to the same class in which the new keyword is actually written.
 * static refers to whatever class in the hierarchy you called the method on.
 */
class A
{
    public function get_self()
    {
        return new self();
    }

    public function get_static()
    {
        return new static();
    }
}

class B extends A
{

}

$a = new A();
$b = new B();
echo '<pre>';
var_dump($a->get_self()); // Returns A Object
var_dump($a->get_static()); // Returns A Object
var_dump($b->get_self()); // Returns A Object
var_dump($b->get_static()); // Returns B Object