<?php
/*
 * This file is part of the psToolboxPlugin package.
 * (c) 2009-2010 Julien Lirochon
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 *
 *
 * @package    psToolboxPlugin
 * @author     Julien Lirochon
 * @author     Loic Vernet
 * 
 * @version    SVN: $Id$
 */
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
    $config = sfConfig::get('ps_toolbox_named_cache', array());
    
    $options = array(
      'class'   => 'sfNoCache',
      'options' => array()
    );
    
    $options = array_merge($options, isset($config['options']) ? $config : array());
    
    $this->cache = new $options['class']($options['options']);
  }
  
  protected function getCache()
  {
    return $this->cache;
  }
  
  static protected function generateKey($name = '', $params = array())
  {
    $params_string = array();

    // Build parameters string "a la" symfony routing
    if (sizeof($params) > 0)
    {
      foreach ($params as $param => $value)
      {
        $params_string[]= sprintf('%s/%s', $param, $value);
      }
    }

    $key = $name. (sizeof($params) > 0 ? '/'. implode('/', $params_string) : '');

    return $key;
  }

  static public function get($name, $default = null, $params = array())
  {   
    $key = self::generateKey($name, $params);

    $data = self::getInstance()->getCache()->get($key, '[[[DEFAULT]]]');
    
    return ('[[[DEFAULT]]]' === $data) ? $default : unserialize($data);
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
    return self::getInstance()->getCache()->set($key, serialize($data), $lifetime);
  }
  
  static public function remove($name, $params = array())
  {
    $key = self::generateKey($name, $params);
    return self::getInstance()->getCache()->remove($key);
  }
	
  static public function removePattern($pattern)
  {
    return self::getInstance()->getCache()->removePattern($pattern);	
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
