<?php

/**
 * Polymorphism - many forms.
 * (When multiple classes implement same interface but define different logic.)
 */

interface Payment {
    public function process();
}

class Paysera implements Payment
{
    public function process()
    {
        echo 'Paysera process logic <br/>';
    }
}

class Paypal implements Payment
{
    public function process()
    {
        echo 'Paypal process logic <br/>';
    }
}
$payment1 = new Paysera();
$payment2 = new Paypal();
$payment1->process(); //same function different logic
$payment2->process(); //same function different logic



