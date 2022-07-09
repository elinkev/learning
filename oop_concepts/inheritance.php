<?php

/**
 * Inheritance is when one class gets features of another class
 */
class ClassA extends ClassB
{

}

class ClassB
{
    public function inheretedFunction () {
        echo 'This is an inhereted function from ClassB';
    }
}
$classA = new ClassA();
$classA->inheretedFunction();



