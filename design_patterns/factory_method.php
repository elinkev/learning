<?php

/**
 * Factory - Creates objects without exposing the instantiation logic to the client and Refers to the newly created object through a common interface.
 * Is a simplified version of Factory Method
 *
 * Factory Method - Defines an interface for creating objects, but let subclasses to decide which class to instantiate
 * and Refers to the newly created object through a common interface.
 *
 * Abstract Factory - Offers the interface for creating a family of related objects,
 * without explicitly specifying their classes.
 */
abstract class Payment
{
    abstract public function factoryMethod();

    public function process()
    {
        $gateway = $this->factoryMethod();
        var_dump(get_class($gateway));
    }
}

class Paysera extends Payment
{
    public function factoryMethod()
    {
        return new Paysera();
    }
}

class Paypal extends Payment
{
    public function factoryMethod()
    {
        return new Paypal();
    }
}
echo'<pre>';
$gateway1 = new Paysera();
$gateway1->process();
$gateway2 = new Paypal();
$gateway2->process();