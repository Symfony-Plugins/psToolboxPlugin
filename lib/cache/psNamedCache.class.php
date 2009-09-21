<?php

class psNamedCache
{
  static protected $instance = null;
  protected $cache = null;
  
  static protected function getInstance()
  {
    if (!isset(self::$instance))
    {
      self::$instance = new psNamedCache();
      self::$instance->initialize();
    }
    
    return self::$instance;
  }
  
  protected function initialize()
  {
    $config = sfConfig::get('app_psToolbox_named_cache');
    
    $options = array(
      'class' => 'sfNoCache',
      'options' => array()
    );
    
    $options = array_merge($options, $config['options']);
    
    $this->cache = new $options['class'];
    $this->cache->initialize($options['options']);
  }
  
  protected function getCache()
  {
    return $this->cache;
  }
  
  static protected function generateKey($name = '', $params = array())
  {
    $key = $name . ((sizeof($params) > 0) ? ('/' . implode('/', $params)) : '');
    return $key;
  }

  static public function get($name, $default = null, $params = array())
  {
    $key = self::generateKey($name, $params);
    return $this->getInstance()->getCache()->get($key, $default);
  }
  
  static public function getQueryResult($query, $name, $params = array(), $lifetime = null)
  {
    if (!is_object($query) || !($query instanceof Doctrine_Query))
    {
      throw new sfException('invalid query object');
    }
    
    $key = self::generateKey($name, $params);
    $defaultValue = '#%@psNamedCacheDefaultValue@%#';
    $instance = self::getInstance();
    $data = $instance->getCache()->get($key, $defaultValue);

    if ($data===$defaultValue)
    {
      $result = $query->execute();
      $instance->getCache()->set($key, array($query->getRoot()->getComponentName() => $result->toArray(true)), $lifetime);
      return $result;
    }
    
    $keys = array_keys($data);
    $result = new Doctrine_Collection($keys[0]);
    $result->fromArray($data[$keys[0]], true);
    
    return $result;
  }
  
  static public function has($name, $params = array())
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->has($key);
  }
  
  static public function set($name, $data, $params = array(), $lifetime = null)
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->set($key, $data, $lifetime);
  }
  
  static public function remove($name, $params = array())
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->remove($key);
  }
  
  static public function clean($mode = sfCache::ALL)
  {
    return self::getInstance()->getCache()->clean($mode);
  }
  
  static public function getTimeout($name, $params = array())
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->getTimeout($key);
  }
  
  static public function getLastModified($name, $params = array())
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->getLastModified($key);
  }
}
